import type { Vnd } from '../money/format';
import { addMonthsTo, potMonthlyNeed } from './plan-river';

/**
 * A pot's "needed by": a month ('YYYY-MM') from the pay cycle's own month up to ten years ahead,
 * or no date. Set-asides are monthly (one per pay cycle), so the month is all the maths needs.
 */

/** How far ahead a pot's month may be: ten years. */
export const NEEDED_BY_REACH_MONTHS = 120;

/** The quick picks under "Needed by", in months from the pay cycle's month. */
export const NEEDED_BY_QUICK_PICKS = [3, 6, 12, 24, 60] as const;

/** The last month a pot can be needed by. */
export function latestNeededBy(from: string): string {
  return addMonthsTo(from, NEEDED_BY_REACH_MONTHS);
}

/** A month held between the pay cycle's month and the reach. */
export function clampNeededBy(month: string, from: string): string {
  if (month < from) return from;
  const latest = latestNeededBy(from);
  return month > latest ? latest : month;
}

/** The month a wheel pair stands for (`monthIndex` 0 for January), held inside the reach. */
export function neededByAt(year: number, monthIndex: number, from: string): string {
  const month = `${String(year).padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}`;
  return clampNeededBy(month, from);
}

/**
 * The months the month wheel offers in a year, as 0-based indexes (0 for January): only those
 * inside the reach, so the wheel can never rest on a month that is not allowed.
 */
export function neededByMonths(year: number, from: string): { first: number; last: number } {
  const latest = latestNeededBy(from);
  const first = year === Number(from.slice(0, 4)) ? Number(from.slice(5, 7)) - 1 : 0;
  const last = year === Number(latest.slice(0, 4)) ? Number(latest.slice(5, 7)) - 1 : 11;
  return { first, last };
}

/** The years the year wheel offers: the pay cycle's year through the reach's. */
export function neededByYears(from: string): number[] {
  const first = Number(from.slice(0, 4));
  const last = Number(latestNeededBy(from).slice(0, 4));
  return Array.from({ length: last - first + 1 }, (_, k) => first + k);
}

export interface Horizon {
  readonly years: number;
  readonly months: number;
}

/** How far a month is from the pay cycle's, in whole years and months ("in 2 years 3 months"). */
export function neededByHorizon(from: string, month: string): Horizon {
  const [fy = 0, fm = 0] = from.split('-').map(Number);
  const [ty = 0, tm = 0] = month.split('-').map(Number);
  const total = Math.max(0, (ty - fy) * 12 + (tm - fm));
  return { years: Math.floor(total / 12), months: total % 12 };
}

/**
 * The soonest month a goal can be needed by when the month has `room` to set aside: the first
 * month whose set-aside (rounded up to 50.000₫, as every set-aside is) fits in it. Null when there
 * is no room, or it would not fit even ten years out.
 */
export function soonestNeededBy(input: {
  readonly goal: Vnd;
  readonly saved: Vnd;
  readonly room: Vnd;
  readonly from: string;
}): string | null {
  const left = Math.max(0, input.goal - input.saved);
  if (left === 0) return input.from;
  if (input.room <= 0) return null;
  for (let months = Math.max(1, Math.ceil(left / input.room)); ; months++) {
    if (months > NEEDED_BY_REACH_MONTHS) return null;
    if (potMonthlyNeed(input.goal, input.saved, months) <= input.room) {
      return addMonthsTo(input.from, months);
    }
  }
}

/**
 * What a month has free for a pot: income less bills, Future you and what the other occasion pots
 * set aside. A pot whose set-aside is more than this would take the daily number below zero.
 */
export function potRoom(input: {
  readonly income: Vnd;
  readonly bills: Vnd;
  readonly futureYou: Vnd;
  /** What the other occasion pots set aside this cycle (not the pot being set). */
  readonly otherOccasions: Vnd;
}): Vnd {
  return Math.max(0, input.income - input.bills - input.futureYou - input.otherOccasions);
}
