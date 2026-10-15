import { payCycleOn, type Payday } from '../plan/pay-cycle';
import { LATE_CLOSE_CUTOFF_HOUR, moneyDayOf } from '../time/close-time';
import { addDays, diffDays, parts, type LocalDate } from '../time/local-date';

/** The first and last money day a spend may be moved to, both included. */
export interface DayRange {
  readonly from: LocalDate;
  readonly to: LocalDate;
}

/**
 * The days a spend may be moved to: within the pay cycle it counts in, never after today. A spend
 * in this cycle moves between its first day and today; one still waiting from an earlier cycle
 * stays in that cycle (it already counted there, and moving it into this one would count it twice).
 */
export function spendDayRange(
  day: LocalDate,
  { today, cycleStart, payday }: { today: LocalDate; cycleStart: LocalDate; payday: Payday },
): DayRange {
  if (day >= cycleStart) return { from: cycleStart, to: today };
  const own = payCycleOn(day, payday).start;
  const end = addDays(cycleStart, -1);
  return { from: own <= day ? own : day, to: end >= day ? end : day };
}

/** Every day in a range, oldest first. */
export function daysIn({ from, to }: DayRange): LocalDate[] {
  return Array.from({ length: Math.max(0, diffDays(to, from)) + 1 }, (_, i) => addDays(from, i));
}

/**
 * The hours of a money day in the order they pass: 04 to 23, then 00 to 03 of the night after,
 * which still belong to it.
 */
export const MONEY_DAY_HOURS: readonly number[] = Array.from(
  { length: 24 },
  (_, i) => (i + LATE_CLOSE_CUTOFF_HOUR) % 24,
);

/**
 * The instant at `hour`:`minute` on a money day, never later than `now`: after midnight is the
 * calendar day after, as the money day runs to 04:00.
 */
export function instantOnMoneyDay(day: LocalDate, hour: number, minute: number, now: Date): Date {
  const calendar = hour < LATE_CLOSE_CUTOFF_HOUR ? addDays(day, 1) : day;
  const { year, month, day: date } = parts(calendar);
  const instant = new Date(year, month - 1, date, hour, minute);
  return instant.getTime() > now.getTime() ? now : instant;
}

/** Where a spend sits in time, as its row records it: the instant and the money day it files under. */
export function movedTo(instant: Date): { at: string; day: LocalDate } {
  return { at: instant.toISOString(), day: moneyDayOf(instant) };
}
