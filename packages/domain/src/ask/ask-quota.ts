import { localDateOf, type LocalDate } from '../time/local-date';

/** Questions a day the server reads without Max. On-device mode is never counted. */
export const FREE_ASKS_PER_DAY = 10;

/**
 * Free questions left today, given the days questions were asked on. Max members are never
 * counted.
 */
export function freeAsksLeft(askedOn: readonly LocalDate[], today: LocalDate): number {
  const used = askedOn.filter((day) => day === today).length;
  return Math.max(0, FREE_ASKS_PER_DAY - used);
}

/**
 * The day a daily allowance (Ask questions, cloud voice) is counted on: the phone's calendar day,
 * so it starts again at the user's own midnight, not at the money day's 04:00 and not at UTC's.
 */
export function allowanceDayOf(instant: Date): LocalDate {
  return localDateOf(instant);
}
