import type { Vnd } from '../money/format';
import {
  addDays,
  daysInMonth,
  makeDate,
  weekdayMondayFirst,
  type LocalDate,
} from '../time/local-date';

/** A calendar month, 'YYYY-MM'. */
export type MonthKey = string;

/** The fields of a closed day the Diary reads. */
export interface ClosedDayTotal {
  readonly day: LocalDate;
  /** Counted at the close. */
  readonly spent: Vnd;
  /** That day's line. */
  readonly line: Vnd;
}

export function monthOf(day: LocalDate): MonthKey {
  return day.slice(0, 7);
}

function monthParts(month: MonthKey): { year: number; month: number } {
  const [year, m] = month.split('-').map(Number);
  if (year === undefined || m === undefined || Number.isNaN(year + m)) {
    throw new RangeError(`Not a month: ${month}`);
  }
  return { year, month: m };
}

/** Every day of the month, in order. */
export function daysOfMonth(month: MonthKey): LocalDate[] {
  const { year, month: m } = monthParts(month);
  return Array.from({ length: daysInMonth(year, m) }, (_, i) => makeDate(year, m, i + 1));
}

/** The first day of the month after: the day a month's diary binds. */
export function nextMonthStart(month: MonthKey): LocalDate {
  const { year, month: m } = monthParts(month);
  return addDays(makeDate(year, m, daysInMonth(year, m)), 1);
}

/** The month before, 'YYYY-MM'. */
export function previousMonth(month: MonthKey): MonthKey {
  const { year, month: m } = monthParts(month);
  return monthOf(addDays(makeDate(year, m, 1), -1));
}

/**
 * The month laid out in Monday-first weeks: blanks before the 1st and after the last day, always
 * five or six full weeks (35 or 42 cells) so the card keeps its height month to month.
 */
export function monthGrid(month: MonthKey): (LocalDate | null)[] {
  const days = daysOfMonth(month);
  const first = days[0];
  if (first === undefined) return [];
  const lead = weekdayMondayFirst(first);
  const weeks = Math.max(5, Math.ceil((lead + days.length) / 7));
  return Array.from({ length: weeks * 7 }, (_, i) => days[i - lead] ?? null);
}

/** Green when the day came in at or under its line, orange when it went over. */
export type DayDot = 'under' | 'over';

export function dayDot(spent: Vnd, line: Vnd): DayDot {
  return spent <= line ? 'under' : 'over';
}

/**
 * What a calendar cell is:
 * - `closed`: a paper tile with the day's total and its dot,
 * - `today`: still open, dashed, opens the close,
 * - `missed`: a past day the user never closed, opens the catch-up sheet,
 * - `idle`: a day still ahead, or one before the user started; dimmed, does nothing,
 * - `blank`: outside the month.
 */
export type CalendarCell =
  | { readonly kind: 'blank' }
  | { readonly kind: 'closed'; readonly day: LocalDate; readonly spent: Vnd; readonly dot: DayDot }
  | { readonly kind: 'today' | 'missed' | 'idle'; readonly day: LocalDate };

export function calendarCells(input: {
  readonly month: MonthKey;
  readonly today: LocalDate;
  readonly closed: readonly ClosedDayTotal[];
  /** The first day 6pm has anything for; earlier days were never the user's to close. */
  readonly since: LocalDate | null;
}): CalendarCell[] {
  const closed = new Map(input.closed.map((d) => [d.day, d]));
  return monthGrid(input.month).map((day): CalendarCell => {
    if (day === null) return { kind: 'blank' };
    const row = closed.get(day);
    if (row) return { kind: 'closed', day, spent: row.spent, dot: dayDot(row.spent, row.line) };
    if (day === input.today) return { kind: 'today', day };
    if (day < input.today && input.since !== null && day >= input.since) {
      return { kind: 'missed', day };
    }
    return { kind: 'idle', day };
  });
}

/** How many closed days came in at or under their line. */
export function underCount(closed: readonly ClosedDayTotal[]): number {
  return closed.filter((d) => dayDot(d.spent, d.line) === 'under').length;
}
