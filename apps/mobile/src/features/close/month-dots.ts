import { daysInMonth, parts, type ClosedDayRow, type LocalDate } from '@6pm/domain';

export type MonthDot = 'closed' | 'today' | 'open';

/** One dot per day of the month `today` is in: closed days filled, today popping in, the rest outlined. */
export function monthDots(today: LocalDate, closed: readonly ClosedDayRow[]): MonthDot[] {
  const { year, month } = parts(today);
  const closedDays = new Set(closed.map((d) => d.day));
  return Array.from({ length: daysInMonth(year, month) }, (_, i) => {
    const day = `${today.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
    return day === today ? 'today' : closedDays.has(day) ? 'closed' : 'open';
  });
}
