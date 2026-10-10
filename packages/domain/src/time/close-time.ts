import { addDays, type LocalDate } from './local-date';

/** 'HH:MM' on the phone's clock. */
export type ClockTime = string;

export const DEFAULT_CLOSE_AT: ClockTime = '18:00';

/** A close before this hour still belongs to the day before (closing at 00:40 files Friday). */
export const LATE_CLOSE_CUTOFF_HOUR = 4;

/** Close times the user can pick: 15:00 to 23:45 in quarter hours. */
export const CLOSE_TIME_OPTIONS: readonly ClockTime[] = Array.from({ length: 36 }, (_, i) => {
  const minutes = 15 * 60 + i * 15;
  return clockOf(minutes / 60);
});

export function hoursOf(time: ClockTime): number {
  const [h, m] = time.split(':').map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) {
    throw new RangeError(`Not a clock time: ${time}`);
  }
  return h + m / 60;
}

/** Decimal hour → 'HH:MM', minutes floored: 18.12 → '18:07'. */
export function clockOf(hour: number): ClockTime {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60 + 1e-6);
  return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Where today stands against the close:
 * - `before`: the close is still ahead ("Your close is at 18:00", "Close early"),
 * - `due`: it's six ("It's six. Close your day."),
 * - `open`: an hour past and still open,
 * - `late`: from two hours past (and never before 20:30): "Still open. Close before bed?",
 * - `closed`: done for today.
 */
export type CloseMoment = 'before' | 'due' | 'open' | 'late' | 'closed';

export function closeMoment(hour: number, closeAt: ClockTime, closed: boolean): CloseMoment {
  if (closed) return 'closed';
  const due = hoursOf(closeAt);
  if (hour < due) return 'before';
  if (hour < due + 1) return 'due';
  if (hour < Math.max(due + 2, 20.5)) return 'open';
  return 'late';
}

/** The day a close made now belongs to: after midnight and before the cutoff, it is yesterday. */
export function filingDay(today: LocalDate, hour: number): LocalDate {
  return hour < LATE_CLOSE_CUTOFF_HOUR ? addDays(today, -1) : today;
}
