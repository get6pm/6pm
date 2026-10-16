/**
 * Daily allowances (Ask questions, cloud voice) turn over at the user's own midnight. The phone
 * says how far its clock is from UTC on every call to the server, in minutes east of Greenwich.
 */
export const UTC_OFFSET_HEADER = 'X-Utc-Offset';

/** The widest offset any time zone uses: UTC−12 to UTC+14, so ±14 hours covers them all. */
const MAX_OFFSET_MINUTES = 14 * 60;

const MINUTE_MS = 60_000;

/** The phone's offset from UTC at `instant`, in minutes east: Vietnam is 420. */
export function utcOffsetOf(instant: Date): number {
  // `getTimezoneOffset` counts west; `|| 0` keeps UTC itself from reading as −0.
  return -instant.getTimezoneOffset() || 0;
}

/**
 * The offset a request claims, or 0 (UTC) when it says none, says something unreadable or names an
 * offset no time zone has.
 */
export function readUtcOffset(raw: string | null | undefined): number {
  const text = raw?.trim() ?? '';
  if (!/^[+-]?\d{1,4}$/.test(text)) return 0;
  const minutes = Number(text);
  return Math.abs(minutes) <= MAX_OFFSET_MINUTES ? minutes || 0 : 0;
}

/** The instant the day began at an offset from UTC, as ISO 8601 in UTC. */
export function dayStartAtOffset(now: Date, offsetMinutes: number): string {
  const local = new Date(now.getTime() + offsetMinutes * MINUTE_MS).toISOString().slice(0, 10);
  return new Date(Date.parse(`${local}T00:00:00.000Z`) - offsetMinutes * MINUTE_MS).toISOString();
}
