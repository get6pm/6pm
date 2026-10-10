import type { Vnd } from '../money/format';
import { addDays, diffDays, type LocalDate } from '../time/local-date';
import {
  daysOfMonth,
  nextMonthStart,
  underCount,
  type ClosedDayTotal,
  type MonthKey,
} from './calendar';
import { topPlaces, type DiarySpend, type Place } from './week-recap';

/** The longest stretch of days closed back to back. */
export interface ClosedRun {
  readonly days: number;
  readonly from: LocalDate;
  readonly to: LocalDate;
}

export function longestRun(closedDays: readonly LocalDate[]): ClosedRun | null {
  const days = [...new Set(closedDays)].sort();
  let best: ClosedRun | null = null;
  let start = days[0];
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const next = days[i + 1];
    if (day === undefined || start === undefined) break;
    if (next !== undefined && diffDays(next, day) === 1) continue;
    const length = diffDays(day, start) + 1;
    if (best === null || length > best.days) best = { days: length, from: start, to: day };
    start = next;
  }
  return best;
}

/** A month's money diary, everything the zine prints. */
export interface MonthDiary {
  readonly month: MonthKey;
  readonly days: number;
  readonly closed: readonly ClosedDayTotal[];
  /** Counted across the closed days. */
  readonly spent: Vnd;
  /** The lines of the closed days added up: what the plan allowed. */
  readonly plan: Vnd;
  /** Plan less spent: spare when positive, over when negative. */
  readonly spare: Vnd;
  readonly under: number;
  readonly run: ClosedRun | null;
  readonly quietest: ClosedDayTotal | null;
  readonly biggest: ClosedDayTotal | null;
  readonly places: readonly Place[];
  /** One per day of the month: closed or not. */
  readonly dots: readonly boolean[];
}

export function monthDiary(input: {
  readonly month: MonthKey;
  readonly closed: readonly ClosedDayTotal[];
  readonly spends: readonly DiarySpend[];
  readonly notDaily: ReadonlySet<string>;
}): MonthDiary {
  const all = daysOfMonth(input.month);
  const closed = input.closed
    .filter((d) => d.day.startsWith(input.month))
    .slice()
    .sort((a, b) => (a.day < b.day ? -1 : 1));
  const spent = closed.reduce((sum, d) => sum + d.spent, 0);
  const plan = closed.reduce((sum, d) => sum + d.line, 0);
  const byAmount = closed.slice().sort((a, b) => a.spent - b.spent || (a.day < b.day ? -1 : 1));
  const closedSet = new Set(closed.map((d) => d.day));
  return {
    month: input.month,
    days: all.length,
    closed,
    spent,
    plan,
    spare: plan - spent,
    under: underCount(closed),
    run: longestRun(closed.map((d) => d.day)),
    quietest: byAmount[0] ?? null,
    biggest: byAmount.length > 1 ? (byAmount[byAmount.length - 1] ?? null) : null,
    places: topPlaces(
      input.spends.filter((s) => closedSet.has(s.day)),
      input.notDaily,
    ),
    dots: all.map((d) => closedSet.has(d)),
  };
}

/** A month's totals as the shelf reads them. */
export interface MonthTotal {
  readonly month: MonthKey;
  readonly closed: number;
  readonly spent: Vnd;
  readonly line: Vnd;
}

/** One diary on the shelf. */
export interface ShelfDiary {
  readonly month: MonthKey;
  /** Nº 01 is the first month with a closed day. */
  readonly no: number;
  readonly closed: number;
  readonly days: number;
  /** Lines less spent: spare when positive. */
  readonly spare: Vnd;
  /** Still being written: this month. */
  readonly inProgress: boolean;
  /** The day it binds: the 1st of the month after. */
  readonly binds: LocalDate;
}

/**
 * The money diaries, newest first: this month in progress, then every earlier month with at least
 * one closed day, numbered from the first.
 */
export function diaryShelf(today: LocalDate, totals: readonly MonthTotal[]): ShelfDiary[] {
  const current = today.slice(0, 7);
  const past = totals.filter((t) => t.month < current && t.closed > 0);
  const now = totals.find((t) => t.month === current);
  const months = [...past, now ?? { month: current, closed: 0, spent: 0, line: 0 }].sort((a, b) =>
    a.month < b.month ? -1 : 1,
  );
  return months
    .map((t, i): ShelfDiary => ({
      month: t.month,
      no: i + 1,
      closed: t.closed,
      days: daysOfMonth(t.month).length,
      spare: t.line - t.spent,
      inProgress: t.month === current,
      binds: nextMonthStart(t.month),
    }))
    .reverse();
}

/** The last day of a month. */
export function monthEnd(month: MonthKey): LocalDate {
  return addDays(nextMonthStart(month), -1);
}
