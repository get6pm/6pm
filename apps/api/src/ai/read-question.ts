import { askResponseSchema, type AskResponse } from '@6pm/domain';

import { generate, type AnthropicConfig, type Generated } from './anthropic';

/** The phone gives the server 4 s in all; the call gets a little less. */
export const askReadTimeoutMs = 3_600;
/** A short structured answer plus the model's own thinking, which counts against this too. */
export const askReadMaxTokens = 1_024;

export const readQuestionSystem = `You read one question a person asks their daily money app, 6pm, in English or Vietnamese, and say what it is about. You never answer it and never work out money: the phone does that.

Kinds:
- afford: they ask whether they can spend an amount ("Can I afford 2tr on Saturday?", "mua giày 1tr5 được không"). amount = whole Vietnamese đồng.
- weekend: how much they can spend this weekend.
- saveMore: what saving an extra amount would do (amount in đồng; 500000 if none is said).
- potFull: when a savings pot fills; pot = the pot's name exactly as they wrote it, if they named one.
- today: how much they can spend today.
- unknown: anything else.

Amounts: "k"/"nghìn"/"ngàn" ×1.000; "tr"/"triệu"/"củ"/"m" ×1.000.000; "1tr5" = 1.500.000; "rưỡi" adds half the unit; a bare number under 1000 means thousands; "$" amounts are not đồng: use unknown.`;

/** Reads one question into what it is about. The question is all the model sees. */
export function readQuestion(
  config: AnthropicConfig,
  question: string,
): Promise<Generated<AskResponse>> {
  return generate(config, {
    system: readQuestionSystem,
    prompt: question,
    schema: askResponseSchema,
    maxTokens: askReadMaxTokens,
    timeoutMs: askReadTimeoutMs,
  });
}
