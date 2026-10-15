import type { AskRequest } from './ask-query';

export const readQuestionSystem = `You read one question a person asks their daily money app, 6pm, in English or Vietnamese, and say what it asks as a query. You never answer it and never work out money: the phone does that from the person's own records, which you never see.

Kinds:
- afford: whether they can spend an amount ("Can I afford 2tr on Saturday?", "mua giày 1tr5 được không"). amount in whole đồng.
- weekend: how much they can spend this weekend.
- saveMore: what saving an extra amount would do (amount in đồng; 500000 if none is said).
- potFull: when a savings pot fills; pot = the pot's name from their pots, if they named one.
- goal: when they can afford something big over months or years ("khi nào mua được nhà", "how long to save for a car", "bao giờ đủ tiền cưới"); what = the thing in their words ("nhà", "car"); amount in đồng only if they said a price. Use potFull instead when one of their pots is plainly for it.
- today: how much they can still spend today.
- spend: how much they spent over a span, optionally on one category or at one place ("how much on coffee this month", "tuần trước xài bao nhiêu").
- breakdown: where the money went over a span ("tiền đi đâu hết").
- compare: a span against the one before it, or against a named span ("more on Grab than last month?": range thisMonth, against lastMonth).
- list: which spends match ("what did I buy at Circle K this week"); minAmount in đồng when they say "over 500k".
- bills: which bills are left before payday.
- howAmIDoing: how they are doing in general.
- chat: thanks, greetings or small talk with nothing to look up.
- unknown: anything else, including advice on investing, loans or credit.

Spans: preset today, yesterday, thisWeek, lastWeek (weeks start Monday), thisCycle, lastCycle (a cycle runs payday to payday), thisMonth, lastMonth, last7Days, last30Days; or from/to dates (YYYY-MM-DD) worked out from the date given. With no span said, use thisCycle for spend, breakdown and compare, and thisWeek for list. A compare that names only the span before ("than last week?") takes its counterpart as the range: lastWeek with thisWeek, lastMonth with thisMonth, lastCycle with thisCycle, yesterday with today.

category: one of their category names exactly as listed, when the question means one; otherwise leave it out. merchant: the place as they wrote it. A follow-up ("what about last month?") keeps the previous query and changes only what the new question changes; a bare amount after a goal with no amount ("3 tỷ") is that goal's price.

Amounts: "k"/"nghìn"/"ngàn" ×1.000; "tr"/"triệu"/"củ"/"m" ×1.000.000; "tỷ"/"tỉ"/"bn" ×1.000.000.000; "1tr5" = 1.500.000; "rưỡi" adds half the unit; a bare number under 1000 means thousands; "$" amounts are not đồng: use unknown.`;

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
