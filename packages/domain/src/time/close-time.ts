import { addDays, hourOf, localDateOf, parts, type LocalDate } from './local-date';

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

/**
 * The money day an instant belongs to: the phone's calendar day, except before 04:00, when it is
 * still the day before. Today, the close, the Diary and every capture follow this one rule.
 */
export function moneyDayOf(instant: Date): LocalDate {
  return filingDay(localDateOf(instant), hourOf(instant));
}

/**
 * The hour on the money day's own clock: 01:30 after midnight is hour 25.5 of the day before, so
 * "how late is it for tonight's close" keeps counting up through the small hours.
 */
export function moneyHourOf(instant: Date): number {
  const hour = hourOf(instant);
  return hour < LATE_CLOSE_CUTOFF_HOUR ? hour + 24 : hour;
}

/** Days of close reminders kept scheduled ahead: well under the 64 iOS keeps pending for an app. */
export const CLOSE_REMINDER_DAYS = 14;

/** One close reminder: the money day it asks to close, at that day's close time on the phone. */
export interface CloseReminderSlot {
  readonly day: LocalDate;
  readonly at: Date;
}

/**
 * The close reminders to schedule from `now`: one at the close time on each of the next `days`
 * money days, leaving out days already closed and close times already past. Today counts when its
 * close is still ahead.
 */
export function closeRemindersAhead(
  now: Date,
  closeAt: ClockTime,
  closedDays: ReadonlySet<LocalDate>,
  days: number = CLOSE_REMINDER_DAYS,
): CloseReminderSlot[] {
  const hours = hoursOf(closeAt);
  const hour = Math.floor(hours);
  const minute = Math.round((hours - hour) * 60);
  const today = moneyDayOf(now);
  const slots: CloseReminderSlot[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = addDays(today, i);
    if (closedDays.has(day)) continue;
    const { year, month, day: date } = parts(day);
    const at = new Date(year, month - 1, date, hour, minute);
    if (at.getTime() > now.getTime()) slots.push({ day, at });
  }
  return slots;
}
