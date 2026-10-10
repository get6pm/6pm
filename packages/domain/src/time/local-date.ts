/**
 * A calendar day on the user's phone, 'YYYY-MM-DD'. Days are compared as calendar dates, never as
 * instants, so a spend at 23:59 and the close at 00:10 can be filed deliberately (see `filingDay`).
 */
export type LocalDate = string;

const DAY_MS = 86_400_000;

function toUtcMs(date: LocalDate): number {
  const [y, m, d] = date.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y + m + d)) {
    throw new RangeError(`Not a calendar date: ${date}`);
  }
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The phone's calendar day for an instant, in its own time zone. */
export function localDateOf(instant: Date): LocalDate {
  const y = instant.getFullYear();
  const m = String(instant.getMonth() + 1).padStart(2, '0');
  const d = String(instant.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Decimal hour of the day on the phone's clock: 18:07 → 18.1166… */
export function hourOf(instant: Date): number {
  return instant.getHours() + instant.getMinutes() / 60 + instant.getSeconds() / 3600;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(to: LocalDate, from: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parts(date: LocalDate): { year: number; month: number; day: number } {
  const d = new Date(toUtcMs(date));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function makeDate(year: number, month: number, day: number): LocalDate {
  return fromUtcMs(Date.UTC(year, month - 1, day));
}

/** 0 = Monday … 6 = Sunday: the design's weeks start on Monday. */
export function weekdayMondayFirst(date: LocalDate): number {
  return (new Date(toUtcMs(date)).getUTCDay() + 6) % 7;
}

/** The Monday of the week holding `date`. */
export function startOfWeek(date: LocalDate): LocalDate {
  return addDays(date, -weekdayMondayFirst(date));
}
