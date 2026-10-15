import {
  askReadOutputSchema,
  intentOf,
  likeForLike,
  readQuestionPrompt,
  readQuestionSystem,
  type AskRequest,
  type AskResponse,
} from '@6pm/domain';

import { generate, type AnthropicConfig, type Generated } from './anthropic';

/** The phone gives the server 4 s in all; the call gets a little less. */
export const askReadTimeoutMs = 3_600;
/** A short structured answer plus the model's own thinking, which counts against this too. */
export const askReadMaxTokens = 1_024;

/**
 * Reads one question into a query, and the intent an older phone reads from it. The question and
 * the names the phone sent are all the model sees.
 */
export async function readQuestion(
  config: AnthropicConfig,
  request: AskRequest,
): Promise<Generated<AskResponse>> {
  const generated = await generate(config, {
    system: readQuestionSystem,
    prompt: readQuestionPrompt(request),
    schema: askReadOutputSchema,
    maxTokens: askReadMaxTokens,
    timeoutMs: askReadTimeoutMs,
    // The phone stops waiting before a second attempt could answer, and reads it itself.
    retries: 0,
  });
  const query = likeForLike(generated.output.query);
  return { ...generated, output: { intent: intentOf(query), query } };
}
