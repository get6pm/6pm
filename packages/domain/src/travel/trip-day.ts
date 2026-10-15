import { VND, type Currency, type Money } from '../money/currency';
import type { Vnd } from '../money/format';
import type { DailyNumber } from '../plan/daily-number';
import { homeToForeignMinor } from './home-fx';

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
  /** Spent today in the home currency's minor units, exactly as counted. */
  readonly spentHome: Money;
  /** The same as `spentHome`, under the name it had when home was always đồng. */
  readonly spentVnd: Vnd;
  /** How much of the line is spent, 0 to 1. */
  readonly fraction: number;
}

/**
 * The day's line and spend in the currency of the place, at `rate` (home units for one unit; đồng
 * for one unit when home is đồng). What is left is converted from what is left at home, not
 * subtracted after rounding, so it never claims more than the home number does. Null when the
 * rate is unusable.
 */
export function tripDay(
  day: Pick<DailyNumber, 'line' | 'spent'>,
  rate: string,
  home: Currency = VND,
): TripDay | null {
  const whole = (amount: Money, mode: 'round' | 'floor') =>
    homeToForeignMinor(amount, home, 0, rate, mode);
  const line = whole(day.line, 'floor');
  const spent = whole(day.spent, 'round');
  const left = whole(day.line - day.spent, 'floor');
  if (line === null || spent === null || left === null) return null;
  const fraction = day.line > 0 ? Math.min(1, Math.max(0, day.spent / day.line)) : 1;
  return { line, spent, left, spentHome: day.spent, spentVnd: day.spent, fraction };
}
