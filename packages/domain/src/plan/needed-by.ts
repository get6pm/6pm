import { VND, type Currency } from '../money/currency';
import type { Vnd } from '../money/format';
import { addMonthsTo, potMonthlyNeed } from './plan-river';

/**
 * A pot's "needed by": a month ('YYYY-MM') from the pay cycle's own month up to ten years ahead,
 * or no date. Set-asides are monthly (one per pay cycle), so the month is all the maths needs.
 */

/** How far ahead a pot's month may be: ten years. */
export const NEEDED_BY_REACH_MONTHS = 120;

/** The quick picks under the timeline, in months from the pay cycle's month: 1, 2, 5 and 10 years. */
export const NEEDED_BY_SPANS = [12, 24, 60, 120] as const;

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

/** Months from the pay cycle's month to `month`, held inside the reach (0 to 120). */
export function neededByOffset(from: string, month: string): number {
  const [fy = 0, fm = 0] = from.split('-').map(Number);
  const [ty = 0, tm = 0] = month.split('-').map(Number);
  return Math.min(NEEDED_BY_REACH_MONTHS, Math.max(0, (ty - fy) * 12 + (tm - fm)));
}

/** The month `offset` months after the pay cycle's, rounded to a whole month inside the reach. */
export function neededByFromOffset(from: string, offset: number): string {
  const months = Math.min(NEEDED_BY_REACH_MONTHS, Math.max(0, Math.round(offset)));
  return addMonthsTo(from, months);
}

/** One month earlier or later, held inside the reach. */
export function neededByStep(month: string, from: string, by: 1 | -1): string {
  return clampNeededBy(addMonthsTo(clampNeededBy(month, from), by), from);
}

/** The years marked under the timeline: one every two years from the cycle's month to the reach. */
export function neededByMarks(from: string): number[] {
  return Array.from({ length: NEEDED_BY_REACH_MONTHS / 24 + 1 }, (_, k) =>
    Number(addMonthsTo(from, k * 24).slice(0, 4)),
  );
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
 * month whose set-aside (rounded up to fifty steps, 50.000₫ or $50, as every set-aside is) fits.
 * Null when there is no room, or it would not fit even ten years out.
 */
export function soonestNeededBy(input: {
  readonly goal: Vnd;
  readonly saved: Vnd;
  readonly room: Vnd;
  readonly from: string;
  /** The home currency; đồng when not given. */
  readonly currency?: Currency;
}): string | null {
  const left = Math.max(0, input.goal - input.saved);
  if (left === 0) return input.from;
  if (input.room <= 0) return null;
  for (let months = Math.max(1, Math.ceil(left / input.room)); ; months++) {
    if (months > NEEDED_BY_REACH_MONTHS) return null;
    if (potMonthlyNeed(input.goal, input.saved, months, input.currency ?? VND) <= input.room) {
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

export interface PotFit {
  /** The set-aside is no more than the month has free. */
  readonly fits: boolean;
  /** What the month still has free after it (never below zero). */
  readonly left: Vnd;
  /** How much of what is free it takes, 0 to 1 (1 when nothing is free). */
  readonly share: number;
}

/** How a pot's monthly set-aside sits in what the month has free (`potRoom`). */
export function potFit(monthly: Vnd, room: Vnd): PotFit {
  const need = Math.max(0, monthly);
  return {
    fits: need <= room,
    left: Math.max(0, room - need),
    share: room > 0 ? Math.min(1, need / room) : need > 0 ? 1 : 0,
  };
}
