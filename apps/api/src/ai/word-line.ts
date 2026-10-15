import {
  validateLine,
  wordPrompt,
  wordResponseSchema,
  wordSystem,
  type WordRequest,
  type WordResponse,
} from '@6pm/domain';

import { ApiError } from '../errors';

import { generate, type AnthropicConfig, type Generated } from './anthropic';

/** Lines are mostly worded ahead of time; an Ask answer streams in while bars already show. */
export const wordTimeoutMs = 6_000;
/** A line or two plus the model's own thinking, which counts against this too. */
export const wordMaxTokens = 1_024;

/**
 * Words facts in the companion's voice. A line that fails the phone's own check (a digit, an
 * unknown placeholder, a fact left out, a fragment, the wrong language, a put-down) is asked for once more, then fails as
 * `model_unavailable` so the phone words it from its catalogue.
 */
export async function wordLine(
  config: AnthropicConfig,
  request: WordRequest,
  maxLength: number,
): Promise<Generated<WordResponse>> {
  const facts = request.facts.map((f) => f.slots.map((s) => s.name));
  const attempt = () =>
    generate(config, {
      system: wordSystem,
      prompt: wordPrompt(request, maxLength),
      schema: wordResponseSchema,
      maxTokens: wordMaxTokens,
      timeoutMs: wordTimeoutMs,
    });
  const ok = (line: Generated<WordResponse>) =>
    validateLine(line.output.text, {
      facts,
      language: request.language,
      surface: request.surface,
    }).ok;

  const first = await attempt();
  if (ok(first)) return first;
  const second = await attempt();
  if (ok(second)) {
    return {
      ...second,
      inputTokens: first.inputTokens + second.inputTokens,
      outputTokens: first.outputTokens + second.outputTokens,
    };
  }
  throw new ApiError('model_unavailable', 'The model is not answering', { reason: 'invalid_line' });
}
