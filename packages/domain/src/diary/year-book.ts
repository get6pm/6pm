import type { Vnd } from '../money/format';
import { daysInMonth, type LocalDate } from '../time/local-date';
import { underCount, type MonthKey } from './calendar';
import { longestRun, type ClosedRun, type MonthDiary, type MonthTotal } from './month-diary';

/** A calendar year, 'YYYY'. */
export type YearKey = string;

/** The twelve months of a year, January first. */
export function monthsOfYear(year: YearKey): MonthKey[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

/** 365, or 366 in a leap year. */
export function daysOfYear(year: YearKey): number {
  return daysInMonth(Number(year), 2) === 29 ? 366 : 365;
}

/** The day a year's book binds: 31 December. */
export function yearBookBinds(year: YearKey): LocalDate {
  return `${year}-12-31`;
}

/** True from the day the year's book binds. */
export function yearBookBound(today: LocalDate, year: YearKey): boolean {
  return today >= yearBookBinds(year);
}

/** One year book on the Diary shelf. */
export interface ShelfYearBook {
  readonly year: YearKey;
  /** Bound on 31 December: from then it can be shared. */
  readonly bound: boolean;
}

/**
 * The year books, newest first: this year's, waiting until it binds on 31 December (bound on the
 * day itself), then every earlier year with at least one closed day, each already bound.
 */
export function yearBookShelf(today: LocalDate, totals: readonly MonthTotal[]): ShelfYearBook[] {
  const current = today.slice(0, 4);
  const earlier = [
    ...new Set(totals.filter((t) => t.closed > 0).map((t) => t.month.slice(0, 4))),
  ].filter((year) => year < current);
  earlier.sort((a, b) => (a < b ? 1 : -1));
  return [
    { year: current, bound: yearBookBound(today, current) },
    ...earlier.map((year) => ({ year, bound: true })),
  ];
}

/** The months a year's book binds: those of the year with at least one closed day, in order. */
export function yearBookMonths(year: YearKey, diaries: readonly MonthDiary[]): MonthDiary[] {
  return diaries
    .filter((d) => d.month.startsWith(`${year}-`) && d.closed.length > 0)
    .slice()
    .sort((a, b) => (a.month < b.month ? -1 : 1));
}

/** One month as the year book's contents list reads it. */
export interface YearBookLine {
  readonly month: MonthKey;
  readonly closed: number;
  readonly days: number;
  /** Plan less spent: spare when positive, over when negative. */
  readonly spare: Vnd;
}

/** A year at a glance, for the year book's opening page. */
export interface YearSummary {
  readonly year: YearKey;
  /** Days closed across the year, and the days the year has. */
  readonly closed: number;
  readonly days: number;
  readonly spent: Vnd;
  readonly plan: Vnd;
  readonly spare: Vnd;
  readonly under: number;
  /** The longest stretch of days closed back to back, across month ends. */
  readonly run: ClosedRun | null;
  /** What went to Future you over the year: each month's addition summed. */
  readonly saved: Vnd;
  readonly lines: readonly YearBookLine[];
}

/**
 * Adds up the year's money diaries. `saved` holds what each month added to Future you, keyed by
 * month; a month it does not list added nothing.
 */
export function yearSummary(
  year: YearKey,
  diaries: readonly MonthDiary[],
  saved: Readonly<Record<MonthKey, Vnd>> = {},
): YearSummary {
  const months = yearBookMonths(year, diaries);
  const closed = months.flatMap((m) => m.closed);
  const spent = months.reduce((sum, m) => sum + m.spent, 0);
  const plan = months.reduce((sum, m) => sum + m.plan, 0);
  return {
    year,
    closed: closed.length,
    days: daysOfYear(year),
    spent,
    plan,
    spare: plan - spent,
    under: underCount(closed),
    run: longestRun(closed.map((d) => d.day)),
    saved: months.reduce((sum, m) => sum + (saved[m.month] ?? 0), 0),
    lines: months.map((m) => ({
      month: m.month,
      closed: m.closed.length,
      days: m.days,
      spare: m.spare,
    })),
  };
}
