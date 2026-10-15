import { z } from 'zod';

import { daysInMonth, diffDays, makeDate, parts, addDays, startOfWeek } from '../time/local-date';
import type { LocalDate } from '../time/local-date';
import { askIntentSchema, type AskIntent } from './ask-intent';

/** A span a question asks about, as words a model or the rules can name. */
export const askRangePresets = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisCycle',
  'lastCycle',
  'thisMonth',
  'lastMonth',
  'last7Days',
  'last30Days',
] as const;
export type AskRangePreset = (typeof askRangePresets)[number];

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const askRangeSchema = z.union([
  z.object({ preset: z.enum(askRangePresets) }),
  z.object({ from: localDate, to: localDate }),
]);
export type AskRange = z.infer<typeof askRangeSchema>;

/** A category or merchant as the question names it; the phone matches it against its own. */
const name = z.string().trim().min(1).max(60);

/**
 * What a question asks, read by the server's model, the phone's model or the rules. It names
 * things in words; every number of the answer is worked out on the phone from its own data.
 * The first six are the original intents, unchanged.
 */
export const askQuerySchema = z.discriminatedUnion('kind', [
  ...askIntentSchema.options,
  /** "How much did I spend on coffee this month?" */
  z.object({
    kind: z.literal('spend'),
    range: askRangeSchema,
    category: name.optional(),
    merchant: name.optional(),
  }),
  /** "Where did my money go last week?" */
  z.object({ kind: z.literal('breakdown'), range: askRangeSchema }),
  /** "Am I spending more on Grab than last month?" — against the span before, unless named. */
  z.object({
    kind: z.literal('compare'),
    range: askRangeSchema,
    against: askRangeSchema.optional(),
    category: name.optional(),
    merchant: name.optional(),
  }),
  /** "What did I buy at Circle K this week?" */
  z.object({
    kind: z.literal('list'),
    range: askRangeSchema,
    category: name.optional(),
    merchant: name.optional(),
    minAmount: z.number().int().positive().optional(),
  }),
  /** "What bills are left before payday?" */
  z.object({ kind: z.literal('bills') }),
  /** "How am I doing this month?" */
  z.object({ kind: z.literal('howAmIDoing') }),
  /** "Thanks!", "Hi" — a companion line, no numbers. */
  z.object({ kind: z.literal('chat') }),
]);
export type AskQuery = z.infer<typeof askQuerySchema>;

/** A span as dates, from and to inclusive. */
export interface ResolvedRange {
  readonly from: LocalDate;
  readonly to: LocalDate;
  /** The preset it came from, for the words of the answer. */
  readonly preset: AskRangePreset | null;
}

/** Where today sits: what a range is resolved against. */
export interface RangeFrame {
  readonly today: LocalDate;
  readonly cycleStart: LocalDate;
  readonly previousCycleStart: LocalDate | null;
}

function monthStart(date: LocalDate): LocalDate {
  const { year, month } = parts(date);
  return makeDate(year, month, 1);
}

function previousMonth(date: LocalDate): { year: number; month: number } {
  const { year, month } = parts(date);
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

/**
 * A range as dates. Nothing reaches past today; a custom range given backwards is turned round.
 * Last cycle without a cycle before it is null: there is nothing to look at.
 */
export function resolveRange(range: AskRange, frame: RangeFrame): ResolvedRange | null {
  const { today } = frame;
  const span = (from: LocalDate, to: LocalDate, preset: AskRangePreset | null) => ({
    from,
    to: to > today ? today : to,
    preset,
  });
  if ('from' in range) {
    const [a, b] = range.from <= range.to ? [range.from, range.to] : [range.to, range.from];
    return a > today ? null : span(a, b, null);
  }
  const preset = range.preset;
  switch (preset) {
    case 'today':
      return span(today, today, preset);
    case 'yesterday':
      return span(addDays(today, -1), addDays(today, -1), preset);
    case 'thisWeek':
      return span(startOfWeek(today), today, preset);
    case 'lastWeek': {
      const monday = addDays(startOfWeek(today), -7);
      return span(monday, addDays(monday, 6), preset);
    }
    case 'thisCycle':
      return span(frame.cycleStart, today, preset);
    case 'lastCycle':
      return frame.previousCycleStart === null
        ? null
        : span(frame.previousCycleStart, addDays(frame.cycleStart, -1), preset);
    case 'thisMonth':
      return span(monthStart(today), today, preset);
    case 'lastMonth': {
      const { year, month } = previousMonth(today);
      return span(
        makeDate(year, month, 1),
        makeDate(year, month, daysInMonth(year, month)),
        preset,
      );
    }
    case 'last7Days':
      return span(addDays(today, -6), today, preset);
    case 'last30Days':
      return span(addDays(today, -29), today, preset);
  }
}

/**
 * The span a range is compared against when the question names none: the same days of the week,
 * cycle or month before, or the same number of days just before it.
 */
export function rangeBefore(range: ResolvedRange, frame: RangeFrame): ResolvedRange | null {
  const length = diffDays(range.to, range.from);
  if (range.preset === 'thisWeek') {
    const monday = addDays(range.from, -7);
    return { from: monday, to: addDays(monday, length), preset: 'lastWeek' };
  }
  if (range.preset === 'thisCycle') {
    if (frame.previousCycleStart === null) return null;
    const to = addDays(frame.previousCycleStart, length);
    const end = addDays(frame.cycleStart, -1);
    return { from: frame.previousCycleStart, to: to > end ? end : to, preset: 'lastCycle' };
  }
  if (range.preset === 'thisMonth' || range.preset === 'lastMonth') {
    const { year, month } = previousMonth(range.from);
    const last = daysInMonth(year, month);
    // This month so far against the same days of last month; a whole month against a whole one.
    const day = range.preset === 'thisMonth' ? Math.min(parts(range.to).day, last) : last;
    const preset = range.preset === 'thisMonth' ? 'lastMonth' : null;
    return { from: makeDate(year, month, 1), to: makeDate(year, month, day), preset };
  }
  const to = addDays(range.from, -1);
  return { from: addDays(to, -length), to, preset: range.preset === 'today' ? 'yesterday' : null };
}

const askName = z.string().trim().min(1).max(40);

/**
 * `POST /v1/ask`: the question, and to read it well, the money day and the names of the user's
 * own categories and pots, plus the query before it for a follow-up. No amount from the user's
 * plan or spends is ever sent.
 */
export const askRequestSchema = z.object({
  question: z.string().trim().min(1).max(300),
  today: localDate.optional(),
  categories: z.array(askName).max(50).optional(),
  pots: z.array(askName).max(30).optional(),
  previous: askQuerySchema.optional(),
});
export type AskRequest = z.infer<typeof askRequestSchema>;

/**
 * The answer: `query` for phones that read queries, and `intent` (a query outside the original
 * six reads as `unknown`) for phones that only know those.
 */
export const askResponseSchema = z.object({
  intent: askIntentSchema,
  query: askQuerySchema.optional(),
});
export type AskResponse = z.infer<typeof askResponseSchema>;

/** What the model is asked to give back: the query alone. */
export const askReadOutputSchema = z.object({ query: askQuerySchema });

const INTENT_KINDS: ReadonlySet<string> = new Set(
  askIntentSchema.options.map((o) => o.shape.kind.value),
);

/** One of the original intents, which the original engine answers. */
export function isAskIntent(query: AskQuery): query is AskIntent {
  return INTENT_KINDS.has(query.kind);
}

/** The intent an older phone reads from a query. */
export function intentOf(query: AskQuery): AskIntent {
  return isAskIntent(query) ? query : { kind: 'unknown' };
}
