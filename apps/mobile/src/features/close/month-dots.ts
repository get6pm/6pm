import type { ClosedDayRow, LocalDate } from '@6pm/domain';

export type MonthDot = 'closed' | 'today' | 'open';

/** One dot per day of this month: closed days filled, today popping in, the rest outlined. */
export function monthDots(
  now: Date,
  today: LocalDate,
  closed: readonly ClosedDayRow[],
): MonthDot[] {
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const closedDays = new Set(closed.map((d) => d.day));
  return Array.from({ length: days }, (_, i) => {
    const day = `${today.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
    return day === today ? 'today' : closedDays.has(day) ? 'closed' : 'open';
  });
}
