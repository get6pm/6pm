import { z } from 'zod';

import { ApiError } from '../errors';

/**
 * The generation model: DeepSeek, reached over its Anthropic-compatible endpoint. Every call asks
 * for structured output by forcing one tool call and checking its input against a zod schema, so a
 * caller gets typed data or an error, never prose to parse.
 */
export const deepseekUrl = 'https://api.deepseek.com/anthropic/v1/messages';

/** `writer` is the larger model, for writing that matters most; `fast` is for short replies. */
export const deepseekModels = { writer: 'deepseek-v4-pro', fast: 'deepseek-flash' } as const;
export type ModelTier = keyof typeof deepseekModels;

export const deepseekTimeoutMs = { writer: 30_000, fast: 8_000 } as const satisfies Record<
  ModelTier,
  number
>;

export type DeepseekConfig = {
  readonly apiKey: string | undefined;
  /** The network boundary, replaced by recorded answers in tests. */
  readonly fetch?: typeof fetch;
};

export type GenerateRequest<Schema extends z.ZodType> = {
  readonly tier: ModelTier;
  readonly system: string;
  readonly prompt: string;
  /** The tool the model must call; its input is the structured output. */
  readonly tool: { readonly name: string; readonly description: string };
  readonly schema: Schema;
  readonly maxTokens?: number;
  readonly timeoutMs?: number;
};

export type Generated<T> = {
  readonly output: T;
  /** The model id the response names. */
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

const tokenCount = z.number().int().min(0).catch(0);

const messageSchema = z.object({
  model: z.string().min(1),
  content: z.array(z.looseObject({ type: z.string() })),
  usage: z
    .object({ input_tokens: tokenCount, output_tokens: tokenCount })
    .catch({ input_tokens: 0, output_tokens: 0 }),
});

/** One attempt's failure: the wire error it becomes, and whether a second attempt may succeed. */
class AttemptFailed extends Error {
  readonly error: ApiError;
  readonly retryable: boolean;

  constructor(error: ApiError, retryable: boolean) {
    super(error.message);
    this.name = 'AttemptFailed';
    this.error = error;
    this.retryable = retryable;
  }
}

function unavailable(reason: string, retryable: boolean): AttemptFailed {
  return new AttemptFailed(
    new ApiError('model_unavailable', 'The model is not answering', { reason }),
    retryable,
  );
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
}

async function attempt<Schema extends z.ZodType>(
  send: typeof fetch,
  apiKey: string,
  request: GenerateRequest<Schema>,
): Promise<Generated<z.infer<Schema>>> {
  let json: unknown;
  try {
    const response = await send(deepseekUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: deepseekModels[request.tier],
        max_tokens: request.maxTokens ?? 2000,
        // The endpoint refuses a forced tool choice while thinking is on.
        thinking: { type: 'disabled' },
        system: request.system,
        tools: [{ ...request.tool, input_schema: z.toJSONSchema(request.schema) }],
        tool_choice: { type: 'tool', name: request.tool.name },
        messages: [{ role: 'user', content: request.prompt }],
      }),
      signal: AbortSignal.timeout(request.timeoutMs ?? deepseekTimeoutMs[request.tier]),
    });
    if (!response.ok) {
      await response.body?.cancel();
      // A refused request (bad key, bad shape) fails the same way twice; a busy provider may not.
      const busy = response.status === 429 || response.status >= 500;
      throw unavailable(`http_${response.status}`, busy);
    }
    json = await response.json();
  } catch (error) {
    if (error instanceof AttemptFailed) throw error;
    if (isTimeout(error)) {
      // The time budget is spent, so a timeout is not tried again.
      throw new AttemptFailed(new ApiError('model_timeout', 'The model took too long'), false);
    }
    throw unavailable('transport_error', true);
  }

  const message = messageSchema.safeParse(json);
  if (!message.success) throw unavailable('unreadable_response', true);
  const toolUse = message.data.content.find(
    (block) => block.type === 'tool_use' && block['name'] === request.tool.name,
  );
  const output = request.schema.safeParse(toolUse?.['input']);
  if (!output.success) throw unavailable('invalid_output', true);
  return {
    output: output.data,
    model: message.data.model,
    inputTokens: message.data.usage.input_tokens,
    outputTokens: message.data.usage.output_tokens,
  };
}

/**
 * One structured generation. A retryable failure (the provider busy, the connection dropped, or
 * output that does not match the schema) is tried once more; then the call fails with the wire
 * error `model_unavailable`, or `model_timeout` when the time budget ran out.
 */
export async function generate<Schema extends z.ZodType>(
  config: DeepseekConfig,
  request: GenerateRequest<Schema>,
): Promise<Generated<z.infer<Schema>>> {
  if (config.apiKey === undefined || config.apiKey === '') {
    throw new ApiError('model_unavailable', 'The model is not answering', {
      reason: 'missing_key',
    });
  }
  const send = config.fetch ?? fetch;
  try {
    return await attempt(send, config.apiKey, request);
  } catch (first) {
    if (!(first instanceof AttemptFailed)) throw first;
    if (!first.retryable) throw first.error;
    try {
      return await attempt(send, config.apiKey, request);
    } catch (second) {
      throw second instanceof AttemptFailed ? second.error : second;
    }
  }
}
