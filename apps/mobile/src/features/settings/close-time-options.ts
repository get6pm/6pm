import { CLOSE_TIME_OPTIONS } from '@6pm/domain';

/** The close wheels, read from the close times the app allows: hours 15–23, quarter hours. */
export const CLOSE_HOURS = [...new Set(CLOSE_TIME_OPTIONS.map((time) => time.slice(0, 2)))];
export const CLOSE_MINUTES = [...new Set(CLOSE_TIME_OPTIONS.map((time) => time.slice(3)))];

/** The wheel positions for a close time; one that is off the lists rests on the nearest edge. */
export function closeWheelIndexes(closeAt: string): { hour: number; minute: number } {
  return {
    hour: Math.max(0, CLOSE_HOURS.indexOf(closeAt.slice(0, 2))),
    minute: Math.max(0, CLOSE_MINUTES.indexOf(closeAt.slice(3))),
  };
}

/** The close time the two wheels point at, or null if they point outside the allowed times. */
export function closeTimeAtWheels(hour: number, minute: number): string | null {
  const time = `${CLOSE_HOURS[hour] ?? ''}:${CLOSE_MINUTES[minute] ?? ''}`;
  return CLOSE_TIME_OPTIONS.includes(time) ? time : null;
}
