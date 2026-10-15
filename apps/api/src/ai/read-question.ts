import { askReadOutputSchema, intentOf, type AskRequest, type AskResponse } from '@6pm/domain';

import { generate, type AnthropicConfig, type Generated } from './anthropic';

/** The phone gives the server 4 s in all; the call gets a little less. */
export const askReadTimeoutMs = 3_600;
/** A short structured answer plus the model's own thinking, which counts against this too. */
export const askReadMaxTokens = 1_024;

export const readQuestionSystem = `You read one question a person asks their daily money app, 6pm, in English or Vietnamese, and say what it asks as a query. You never answer it and never work out money: the phone does that from the person's own records, which you never see.

Kinds:
- afford: whether they can spend an amount ("Can I afford 2tr on Saturday?", "mua giày 1tr5 được không"). amount in whole đồng.
- weekend: how much they can spend this weekend.
- saveMore: what saving an extra amount would do (amount in đồng; 500000 if none is said).
- potFull: when a savings pot fills; pot = the pot's name from their pots, if they named one.
- today: how much they can still spend today.
- spend: how much they spent over a span, optionally on one category or at one place ("how much on coffee this month", "tuần trước xài bao nhiêu").
- breakdown: where the money went over a span ("tiền đi đâu hết").
- compare: a span against the one before it, or against a named span ("more on Grab than last month?": range thisMonth, against lastMonth).
- list: which spends match ("what did I buy at Circle K this week"); minAmount in đồng when they say "over 500k".
- bills: which bills are left before payday.
- howAmIDoing: how they are doing in general.
- chat: thanks, greetings or small talk with nothing to look up.
- unknown: anything else, including advice on investing, loans or credit.

Spans: preset today, yesterday, thisWeek, lastWeek (weeks start Monday), thisCycle, lastCycle (a cycle runs payday to payday), thisMonth, lastMonth, last7Days, last30Days; or from/to dates (YYYY-MM-DD) worked out from the date given. With no span said, use thisCycle for spend, breakdown and compare, and thisWeek for list.

category: one of their category names exactly as listed, when the question means one; otherwise leave it out. merchant: the place as they wrote it. A follow-up ("what about last month?") keeps the previous query and changes only what the new question changes.

Amounts: "k"/"nghìn"/"ngàn" ×1.000; "tr"/"triệu"/"củ"/"m" ×1.000.000; "1tr5" = 1.500.000; "rưỡi" adds half the unit; a bare number under 1000 means thousands; "$" amounts are not đồng: use unknown.`;

/** The user turn: the question, then what the phone sent to help read it. */
export function readQuestionPrompt(request: AskRequest): string {
  const lines = [`Question: ${request.question}`];
  if (request.today !== undefined) lines.push(`Today: ${request.today}`);
  if (request.categories !== undefined && request.categories.length > 0) {
    lines.push(`Their categories: ${request.categories.join(' | ')}`);
  }
  if (request.pots !== undefined && request.pots.length > 0) {
    lines.push(`Their pots: ${request.pots.join(' | ')}`);
  }
  if (request.previous !== undefined) {
    lines.push(`Previous query: ${JSON.stringify(request.previous)}`);
  }
  return lines.join('\n');
}

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
  });
  const { query } = generated.output;
  return { ...generated, output: { intent: intentOf(query), query } };
}
