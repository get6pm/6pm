import { startOfWeek, type LocalDate } from '../time/local-date';

/** Questions a week without Max; the week starts on Monday. */
export const FREE_ASKS_PER_WEEK = 3;

/** The week a question counts against: its Monday. */
export function askWeek(day: LocalDate): LocalDate {
  return startOfWeek(day);
}

/**
 * Free questions left this week, given the days questions were asked on. Max members are never
 * counted.
 */
export function freeAsksLeft(askedOn: readonly LocalDate[], today: LocalDate): number {
  const week = askWeek(today);
  const used = askedOn.filter((day) => askWeek(day) === week).length;
  return Math.max(0, FREE_ASKS_PER_WEEK - used);
}
