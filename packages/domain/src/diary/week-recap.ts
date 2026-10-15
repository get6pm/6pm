import { designAmount, VND, type Currency } from '../money/currency';
import type { Vnd } from '../money/format';
import { countsTowardDay, type CountedSpend } from '../spend/spend';
import { addDays, startOfWeek, type LocalDate } from '../time/local-date';
import { dayDot, type ClosedDayTotal } from './calendar';

/** A spend as the recaps read it. */
export interface DiarySpend extends CountedSpend {
  readonly day: LocalDate;
  readonly merchant: string;
}

/** One bar of the week: null for days still ahead. */
export interface RecapBar {
  readonly day: LocalDate;
  readonly value: Vnd | null;
  readonly isToday: boolean;
  readonly over: boolean;
  /** Bar height as a share of the chart, 0–100. */
  readonly height: number;
}

/**
 * The first page's story, from closed days only (settled facts, never today's open number):
 * - `under`: the closed days left money over, which rolls on to the days ahead,
 * - `over`: they went over, so the days ahead get a little smaller,
 * - `even`: right on the line,
 * - `fresh`: nothing closed this week yet.
 */
export type RecapStory =
  | { readonly kind: 'under'; readonly days: number; readonly spare: Vnd }
  | { readonly kind: 'over'; readonly over: Vnd }
  | { readonly kind: 'even' }
  | { readonly kind: 'fresh' };

/** A merchant and what went there. */
export interface Place {
  readonly merchant: string;
  readonly category: string;
  readonly visits: number;
  readonly amount: Vnd;
}

export interface WeekRecap {
  readonly from: LocalDate;
  readonly to: LocalDate;
  readonly bars: readonly RecapBar[];
  /** Where the dashed daily line sits, 0–100. */
  readonly lineHeight: number;
  /** Counted from Monday through today. */
  readonly total: Vnd;
  /** Days so far (Monday through today). */
  readonly days: number;
  /** Days so far at or under their line. */
  readonly under: number;
  readonly story: RecapStory;
  readonly places: readonly Place[];
}

/** The design's chart reads 500k as 70% of its height; bigger weeks rescale to fit. */
const CHART_SPAN_DONG = 500_000;
const CHART_FILL = 70;
const MIN_BAR = 5;

/** Where the money went: merchants by amount, most first, counted spends only. */
export function topPlaces(
  spends: readonly DiarySpend[],
  notDaily: ReadonlySet<string>,
  limit = 3,
): Place[] {
  const groups = new Map<
    string,
    { merchant: string; categories: Map<string, number>; visits: number; amount: number }
  >();
  for (const s of spends) {
    if (!countsTowardDay(s, notDaily)) continue;
    const key = s.merchant.trim().toLocaleLowerCase();
    const group = groups.get(key) ?? {
      merchant: s.merchant.trim(),
      categories: new Map<string, number>(),
      visits: 0,
      amount: 0,
    };
    group.visits += 1;
    group.amount += s.amount;
    group.categories.set(s.category, (group.categories.get(s.category) ?? 0) + 1);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((g) => ({
      merchant: g.merchant,
      category: [...g.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '',
      visits: g.visits,
      amount: g.amount,
    }))
    .sort(
      (a, b) => b.amount - a.amount || b.visits - a.visits || a.merchant.localeCompare(b.merchant),
    )
    .slice(0, limit);
}

/**
 * The week so far, Monday first: one bar per day (a closed day shows what it closed at, an open
 * one what has counted so far), the story of the closed days and where the money went.
 */
export function weekRecap(input: {
  readonly today: LocalDate;
  /** Today's line: where the dashed line is drawn and what open days are measured against. */
  readonly line: Vnd;
  readonly closed: readonly ClosedDayTotal[];
  /** Spends from Monday through today, any status. */
  readonly spends: readonly DiarySpend[];
  readonly notDaily: ReadonlySet<string>;
  /** The home currency, for the chart's starting scale; đồng when not given. */
  readonly currency?: Currency;
}): WeekRecap {
  const from = startOfWeek(input.today);
  const closed = new Map(input.closed.map((d) => [d.day, d]));
  const counted = new Map<LocalDate, Vnd>();
  for (const s of input.spends) {
    if (countsTowardDay(s, input.notDaily))
      counted.set(s.day, (counted.get(s.day) ?? 0) + s.amount);
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(from, i);
    const row = closed.get(day);
    const value = day > input.today ? null : (row?.spent ?? counted.get(day) ?? 0);
    return { day, value, line: row?.line ?? input.line, closed: row !== undefined };
  });
  const so = days.filter((d) => d.value !== null);
  // The design's scale until a day (or the line) passes 500k; then the tallest fills 70%.
  const span = designAmount(CHART_SPAN_DONG, input.currency ?? VND);
  const scale = Math.max(span, input.line, ...so.map((d) => d.value ?? 0));
  const pct = (v: number) => Math.round((v / scale) * CHART_FILL);

  const bars = days.map((d): RecapBar => ({
    day: d.day,
    value: d.value,
    isToday: d.day === input.today,
    over: d.value !== null && dayDot(d.value, d.line) === 'over',
    height: d.value === null ? 0 : Math.max(MIN_BAR, pct(d.value)),
  }));

  const settled = days.filter((d) => d.closed);
  const net = settled.reduce((sum, d) => sum + d.line - (d.value ?? 0), 0);
  const story: RecapStory =
    settled.length === 0
      ? { kind: 'fresh' }
      : net > 0
        ? {
            kind: 'under',
            days: settled.filter((d) => dayDot(d.value ?? 0, d.line) === 'under').length,
            spare: net,
          }
        : net < 0
          ? { kind: 'over', over: -net }
          : { kind: 'even' };

  return {
    from,
    to: input.today,
    bars,
    lineHeight: pct(input.line),
    total: so.reduce((sum, d) => sum + (d.value ?? 0), 0),
    days: so.length,
    under: so.filter((d) => dayDot(d.value ?? 0, d.line) === 'under').length,
    story,
    places: topPlaces(input.spends, input.notDaily),
  };
}
