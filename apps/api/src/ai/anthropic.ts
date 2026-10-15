import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';

import { ApiError } from '../errors';

/**
 * Claude, through Anthropic's own SDK: every model call the server makes. Each call asks for
 * structured output (a JSON schema), opts into Anthropic's server-side fallback when the model has
 * one, and checks the stop reason before reading anything.
 *
 * Receipt photos: Haiku read every total of the real receipts Opus did and one more, at a fortieth
 * of the price; the shop names it makes up are dropped on the phone unless the photo's own text
 * shows them. Text routes (reading Ask questions, wording lines, naming merchants, choosing
 * category icons) start on Haiku too; each route names its model, so one can move up alone.
 */
export const anthropicModel: AnthropicModel = 'claude-haiku-5-5';

/**
 * The models a call may run on. Only those Anthropic offers a server-side fallback for opt into
 * it, which re-runs a declined request on the model recommended for the decline's category.
 */
export const anthropicModels = {
  'claude-opus-5-5': { fallback: true },
  'claude-sonnet-5-5': { fallback: true },
  'claude-haiku-5-5': { fallback: false },
} as const;
export type AnthropicModel = keyof typeof anthropicModels;
/** The models a receipt read may run on: any of them. */
export type VisionModel = AnthropicModel;
export const visionModels = anthropicModels;

const fallbackBeta = 'server-side-fallback-2026-07-01';

export type AnthropicConfig = {
  readonly apiKey: string | undefined;
  /** The network boundary, replaced by recorded answers in tests. */
  readonly fetch?: typeof fetch;
};

export type StructuredRequest<Schema extends z.ZodType> = {
  readonly system: string;
  /** The text of the user turn (after the image, for an image read). */
  readonly prompt: string;
  /** The output's shape: sent as the JSON schema, and checked again on the way back. */
  readonly schema: Schema;
  readonly maxTokens: number;
  /** Per attempt; one more attempt follows a busy provider or a dropped connection. */
  readonly timeoutMs: number;
  /** Attempts after the first: 1 unless the caller cannot wait for a second. */
  readonly retries?: number;
  /** `anthropicModel` unless the route names another. */
  readonly model?: AnthropicModel;
};

export type ImageReadRequest<Schema extends z.ZodType> = StructuredRequest<Schema> & {
  /** Base64 JPEG, without a `data:` prefix. */
  readonly image: string;
};

export type ImageRead<T> = {
  /** Null when the model declined, after any fallback model also declined. */
  readonly output: T | null;
  /** The model that answered (a fallback model when one served the request). */
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

function unavailable(reason: string): ApiError {
  return new ApiError('model_unavailable', 'The model is not answering', { reason });
}

/** Any failure from the SDK as a wire error. The SDK has already retried what can be retried. */
function toModelError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new ApiError('model_timeout', 'The model took too long');
  }
  if (error instanceof Anthropic.APIConnectionError) return unavailable('transport_error');
  if (error instanceof Anthropic.APIError && error.status !== undefined) {
    return unavailable(`http_${error.status}`);
  }
  return unavailable('transport_error');
}

/** The SDK client for one call. Creating one is cheap: it holds no connection. */
export function anthropicClient(
  config: AnthropicConfig,
  timeoutMs: number,
  retries = 1,
): Anthropic {
  if (config.apiKey === undefined || config.apiKey === '') throw unavailable('missing_key');
  return new Anthropic({
    apiKey: config.apiKey,
    timeout: timeoutMs,
    // Another attempt on 429, 5xx and dropped connections, after the SDK's own short backoff.
    maxRetries: retries,
    ...(config.fetch === undefined ? {} : { fetch: config.fetch }),
  });
}

/**
 * One call with structured output. Fails with `model_unavailable` (or `model_timeout`) when the
 * model cannot be reached or answers outside the schema; a decline is not a failure, it is an
 * answer with no output, so its tokens still reach the ledger.
 */
async function structured<Schema extends z.ZodType>(
  config: AnthropicConfig,
  request: StructuredRequest<Schema>,
  content: string | Anthropic.Beta.BetaContentBlockParam[],
): Promise<ImageRead<z.infer<Schema>>> {
  const client = anthropicClient(config, request.timeoutMs, request.retries);
  const { type, schema } = zodOutputFormat(request.schema);
  const model = request.model ?? anthropicModel;
  let message: Anthropic.Beta.BetaMessage;
  try {
    message = await client.beta.messages.create({
      model,
      max_tokens: request.maxTokens,
      ...(anthropicModels[model].fallback ? { betas: [fallbackBeta], fallbacks: 'default' } : {}),
      // Thinking stays at the model's default: Haiku refuses a request that turns it off.
      output_config: { effort: 'low', format: { type, schema } },
      system: request.system,
      messages: [{ role: 'user', content }],
    });
  } catch (error) {
    throw toModelError(error);
  }

  const usage = {
    model: message.model,
    inputTokens:
      message.usage.input_tokens +
      (message.usage.cache_creation_input_tokens ?? 0) +
      (message.usage.cache_read_input_tokens ?? 0),
    outputTokens: message.usage.output_tokens,
  };
  // A decline arrives as a normal answer; its content is empty or partial and is never read.
  if (message.stop_reason === 'refusal') return { ...usage, output: null };
  if (message.stop_reason !== 'end_turn')
    throw unavailable(`stop_${message.stop_reason ?? 'none'}`);

  const text = message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw unavailable('invalid_output');
  }
  const output = request.schema.safeParse(json);
  if (!output.success) throw unavailable('invalid_output');
  return { ...usage, output: output.data };
}

/** Reads one image into structured output (see `structured`). */
export function readImage<Schema extends z.ZodType>(
  config: AnthropicConfig,
  request: ImageReadRequest<Schema>,
): Promise<ImageRead<z.infer<Schema>>> {
  return structured(config, request, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: request.image } },
    { type: 'text', text: request.prompt },
  ]);
}

/** A text call whose answer the route needs: a decline is the model being unavailable. */
export type Generated<T> = {
  readonly output: T;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

/**
 * One text call with structured output. Unlike an image read, a decline fails as
 * `model_unavailable` (reason `refusal`): the phone then answers from its own tiers.
 */
export async function generate<Schema extends z.ZodType>(
  config: AnthropicConfig,
  request: StructuredRequest<Schema>,
): Promise<Generated<z.infer<Schema>>> {
  const read = await structured(config, request, request.prompt);
  if (read.output === null) throw unavailable('refusal');
  return { ...read, output: read.output };
}
