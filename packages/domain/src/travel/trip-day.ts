import type { Vnd } from '../money/format';
import type { DailyNumber } from '../plan/daily-number';
import { vndToForeignWhole } from './fx';

/** Rates older than this are stale: the source publishes on working days, so two days is late. */
export const FX_STALE_HOURS = 48;

/**
 * Whether rates effective on `asOf` (a calendar date, `YYYY-MM-DD`, taken as its UTC midnight)
 * are too old to trust at `now`. A date that cannot be read is stale.
 */
export function isFxStale(asOf: string, now: Date, thresholdHours = FX_STALE_HOURS): boolean {
  const at = Date.parse(`${asOf}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(at)) return true;
  return now.getTime() - at > thresholdHours * 60 * 60 * 1000;
}

/** Today abroad, in whole local units: "฿640 of ฿1.200", "฿560 left". */
export interface TripDay {
  /** Today's line in the local currency, rounded down. */
  readonly line: number;
  /** Spent today in the local currency, to the nearest unit. */
  readonly spent: number;
  /** What is left of the line, rounded down; negative when the day went over. */
  readonly left: number;
  /** Spent today in đồng, exactly as counted. */
  readonly spentVnd: Vnd;
  /** How much of the line is spent, 0 to 1. */
  readonly fraction: number;
}

/**
 * The day's line and spend in the currency of the place, at `rate` (đồng for one unit). What is
 * left is converted from the đồng left, not subtracted after rounding, so it never claims more
 * than the đồng number does. Null when the rate is unusable.
 */
export function tripDay(day: Pick<DailyNumber, 'line' | 'spent'>, rate: string): TripDay | null {
  const line = vndToForeignWhole(day.line, rate, 'floor');
  const spent = vndToForeignWhole(day.spent, rate, 'round');
  const left = vndToForeignWhole(day.line - day.spent, rate, 'floor');
  if (line === null || spent === null || left === null) return null;
  const fraction = day.line > 0 ? Math.min(1, Math.max(0, day.spent / day.line)) : 1;
  return { line, spent, left, spentVnd: day.spent, fraction };
}
