import { validateLine, wordResponseSchema, type WordRequest, type WordResponse } from '@6pm/domain';

import { ApiError } from '../errors';

import { generate, type AnthropicConfig, type Generated } from './anthropic';

/** Lines are mostly worded ahead of time; an Ask answer streams in while bars already show. */
export const wordTimeoutMs = 6_000;
/** A line or two plus the model's own thinking, which counts against this too. */
export const wordMaxTokens = 1_024;

/** What each kind of fact or answer means, so the model words it for what it is. */
const KIND_MEANINGS: Readonly<Record<string, string>> = {
  todayOver:
    'today went over its line by {over}; tomorrow’s line is {tomorrow}. Reassure: the plan absorbs it.',
  todayUnder: 'today is under its line: {spent} spent, {safe} still safe.',
  noSpendYet: 'nothing spent yet today; today’s line is {line}.',
  waitingTonight: '{count} spends ({amount}) wait for tonight’s close.',
  paydaySoon: 'payday is in {days} days, on {payday}.',
  billDue: 'the bill {bill} ({amount}) falls due in {days} days.',
  categoryPace:
    '{category} this cycle so far is {now}, {compare} than the same days last cycle ({before}).',
  repeatMerchant: '{merchant} {visits} times since Monday, {amount} in all.',
  firstTimeMerchant: 'first time at {merchant} ({amount}).',
  biggestSpend: 'the week’s biggest spend: {amount} at {merchant} ({category}).',
  underStreak: '{days} closed days in a row at or under the line.',
  closeStreak: '{days} days in a row the day was closed.',
  weekSpare: 'this week {days} closed days left {spare} over, which rolls on to the days ahead.',
  weekOver: 'this week’s closed days went {over} over; the days ahead get a little smaller.',
  potMilestone: 'the pot {pot} is past {percent}% of its goal.',
  potFull: 'the pot {pot} is full, or (as an answer) the month it fills.',
  workToClaim: '{count} work spends ({amount}) are waiting to be claimed back.',
  fitsToday: 'the amount asked fits in what is still safe today.',
  fits: 'the amount fits this cycle; the bars show tomorrow’s line before and after.',
  tight: 'the amount fits, but the days after get tight; maybe take some from the pots.',
  notThisMonth: 'the amount does not fit before payday.',
  weekend: 'what the weekend days can spend.',
  saveMore: 'what moving more to Future you would cost a day.',
  noPots: 'there are no pots yet; one can be made in Plan.',
  noSuchPot: 'no pot by that name.',
  today: 'what is safe to spend today and tomorrow.',
  help: 'the question was not understood; suggest what can be asked.',
  spent: 'what was spent over the span asked.',
  breakdown: 'where the money went over the span, biggest first.',
  compared: 'the span against the one before it.',
  listed: 'the spends that match, newest first.',
  bills: 'the bills left before payday.',
  howAmIDoing: 'the few things most worth knowing right now.',
  noSuchCategory: 'no category by that name.',
  noRange: 'there is nothing to look at for that span yet.',
  chat: 'small talk; nothing to look up.',
};

const PERSONAS: Readonly<Record<WordRequest['persona'], string>> = {
  soft: 'Soft: warm and encouraging, like a kind friend.',
  cheeky: 'Cheeky: playful and teasing in a friendly way; an emoji now and then.',
  roast: 'Roast: a cheeky roast of the habit, never of the person; kind underneath.',
  plain: 'Plain: neutral and factual, no jokes, no emoji, no exclamation marks.',
};

export const wordSystem = `You write one short line for 6pm, a daily money app, in the voice of its companion. The phone has already worked out every number; you only word what it gives you.

Rules:
- Write values only as the placeholders you are given, exactly as {name}. Never write a digit or a number yourself, and never a value that was not given.
- Say only what the facts say. Do not add advice, especially not about investing, loans or credit.
- Never shame, scold or put the person down; tease a habit at most.
- One or two short sentences, in the language asked. Vietnamese: casual Southern-neutral texting, the companion says "mình" and calls the person "bạn", particles like "nha", "nè"; a pot is "hũ", Future you is "bạn của tương lai", closing the day is "chốt ngày".
- Pick the mood the companion shows: calm, happy (good news), wave (hello), nod (something went over), think (a question or a look ahead), sleepy (late), plain (plain voice only).`;

/** The user turn: voice, surface, the facts with their placeholders, and the question if any. */
export function wordPrompt(request: WordRequest, maxLength: number): string {
  const lines = [
    `Language: ${request.language === 'vi' ? 'Vietnamese' : 'English'}`,
    `Voice: ${PERSONAS[request.persona]}`,
    `Where it shows: ${request.surface}, at most ${String(maxLength)} characters.`,
  ];
  if (request.companion !== undefined) {
    lines.push(`You are ${request.companion.name}: ${request.companion.personality}`);
  }
  if (request.question !== undefined) lines.push(`They asked: ${request.question}`);
  for (const fact of request.facts) {
    const meaning = KIND_MEANINGS[fact.kind] ?? fact.kind;
    lines.push(`Fact (${fact.kind}): ${meaning}`);
    for (const slot of fact.slots) lines.push(`  {${slot.name}} = ${slot.value}`);
  }
  return lines.join('\n');
}

/**
 * Words facts in the companion's voice. A line that fails the phone's own check (a digit, an
 * unknown placeholder, the wrong language, a put-down) is asked for once more, then fails as
 * `model_unavailable` so the phone words it from its catalogue.
 */
export async function wordLine(
  config: AnthropicConfig,
  request: WordRequest,
  maxLength: number,
): Promise<Generated<WordResponse>> {
  const allowed = request.facts.flatMap((f) => f.slots.map((s) => s.name));
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
      allowed,
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
