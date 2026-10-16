import {
  ceilToSetAside,
  designAmount,
  roundToStep,
  VND,
  type Currency,
  type Money as Vnd,
} from '../money/currency';
import {
  addDays,
  daysInMonth,
  diffDays,
  makeDate,
  parts,
  type LocalDate,
} from '../time/local-date';
import { dailyNumber, joinedFree, type DailyNumberInput } from './daily-number';
import { cycleMonth, type PayCycle } from './pay-cycle';

/**
 * The money river's segments, left to right. `before` is the part of the cycle's free money that
 * was already gone when the user joined 6pm: it is empty in every other cycle.
 */
export const RIVER_SEGMENTS = [
  'bills',
  'futureYou',
  'occasions',
  'before',
  'spent',
  'free',
] as const;
export type RiverSegment = (typeof RIVER_SEGMENTS)[number];

export interface RiverInput {
  readonly income: Vnd;
  readonly bills: Vnd;
  /** Future you's monthly amount, paid first on payday. */
  readonly futureYou: Vnd;
  /** Σ every occasion pot's monthly set-aside. */
  readonly occasions: Vnd;
  /** +100k top-ups to Future you goals this cycle. */
  readonly goalTopUps: Vnd;
  /** +100k top-ups to occasion pots this cycle. */
  readonly occasionTopUps: Vnd;
  /** Free money right now (`DailyNumber.free`). */
  readonly free: Vnd;
  /** The share of the cycle's free money still to come (`joinedShare`); 1 outside the joined cycle. */
  readonly share?: number;
  /** What the person said went before they joined (`joinedCycle`), in place of the estimate. */
  readonly beforeJoining?: Vnd | null;
}

/**
 * Where the month's money goes: bills, Future you (with its top-ups), occasions (with theirs),
 * what was gone before 6pm started counting (only in the cycle the user joined), everything spent
 * since, and what is still free. The segments add up to the income.
 */
export function moneyRiver(input: RiverInput): Readonly<Record<RiverSegment, Vnd>> {
  const { share = 1 } = input;
  const futureYou = input.futureYou + input.goalTopUps;
  const occasions = input.occasions + input.occasionTopUps;
  const planned = input.income - input.bills - input.futureYou - input.occasions;
  // What the engine leaves out of the cycle's free money was spent before joining: the person's
  // own answer, or the estimate, which counts a shortfall whole, so none of it was before.
  const before = planned - joinedFree(planned, share, input.beforeJoining);
  return {
    bills: input.bills,
    futureYou,
    occasions,
    before,
    spent: input.income - input.bills - futureYou - occasions - before - input.free,
    free: input.free,
  };
}

/**
 * Tomorrow's daily number if Future you got `candidate`: the same engine as the committed number
 * (so the joined cycle's share applies and a release never jumps), with only Future you changed.
 */
export function whatIfDaily(input: DailyNumberInput, candidate: Vnd): Vnd {
  if (input.daysLeft <= 0) return 0;
  return dailyNumber({ ...input, plan: { ...input.plan, futureYou: candidate } }).tomorrow;
}

/**
 * How a day changes per extra amount set aside now: "about 5k a day" for 100k over 22 days. A pot
 * that sets money aside out of the cycle's free money takes only the joined `share` of it.
 */
export function aboutPerDay(amount: Vnd, daysLeft: number, share = 1, currency = VND): Vnd {
  const taken = amount * share;
  if (daysLeft <= 0) return Math.round(taken);
  return roundToStep(taken / daysLeft, currency);
}

/** The day bars' full height: the design's 600k, or the most a day could be with nothing set aside. */
export function dayBarScale(input: DailyNumberInput): Vnd {
  return Math.max(designAmount(600_000, input.currency ?? VND), whatIfDaily(input, 0));
}

/** A day bar's height as a fraction of the row: never below 8%, never above full. */
export function dayBarFraction(daily: Vnd, scale: Vnd): number {
  if (scale <= 0) return 0.08;
  return Math.max(8, Math.min(100, Math.round((daily / scale) * 100))) / 100;
}

/** 'YYYY-MM' of a day. */
function monthKey(day: LocalDate): string {
  return day.slice(0, 7);
}

/** 'YYYY-MM' moved by whole months. */
export function addMonthsTo(month: string, by: number): string {
  const [y = 0, m = 1] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + by;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** Months from one month ('YYYY-MM') to another, at least one: the last month still counts. */
export function monthsBetween(from: string, to: string): number {
  const [fy = 0, fm = 0] = from.split('-').map(Number);
  const [ty = 0, tm = 0] = to.split('-').map(Number);
  return Math.max(1, (ty - fy) * 12 + (tm - fm));
}

/** Months from `today`'s month to `month` ('YYYY-MM'), at least one. */
export function monthsUntil(today: LocalDate, month: string): number {
  return monthsBetween(monthKey(today), month);
}

/**
 * An occasion pot's monthly set-aside: what is left, spread over the months to its date, rounded
 * up to fifty steps (50.000₫, $50) but never more than what is left. Nothing when it is full or has no date.
 */
export function potMonthlyNeed(
  goal: Vnd,
  saved: Vnd,
  monthsLeft: number | null,
  currency: Currency = VND,
): Vnd {
  const left = Math.max(0, goal - saved);
  if (left === 0 || monthsLeft === null || monthsLeft <= 0) return 0;
  return Math.min(left, ceilToSetAside(left / monthsLeft, currency));
}

/** A goal's share of Future you, each month; never below zero. */
export function goalMonthly(futureYou: Vnd, share: number): Vnd {
  return Math.max(0, Math.round(futureYou * share)) || 0;
}

export type GoalStatus = 'reached' | 'paused' | 'onTrack' | 'behind' | 'steady';

export interface GoalPlan {
  readonly status: GoalStatus;
  /** 'YYYY-MM' the goal fills at its monthly pace; null when reached or paused. */
  readonly eta: string | null;
  readonly monthly: Vnd;
}

/**
 * When a Future you goal fills: months of its monthly share until nothing is left, counted from
 * the pay cycle's month (`cycleMonth`) as an occasion counts its months left, so the answer holds
 * still from payday to payday. With a date it is on track when it fills by then; without one it
 * just keeps going.
 */
export function goalPlan(input: {
  readonly goal: Vnd;
  readonly saved: Vnd;
  readonly monthly: Vnd;
  readonly neededBy: string | null;
  readonly cycle: PayCycle;
}): GoalPlan {
  const left = Math.max(0, input.goal - input.saved);
  const { monthly } = input;
  if (left === 0) return { status: 'reached', eta: null, monthly };
  if (monthly <= 0) return { status: 'paused', eta: null, monthly };
  const eta = addMonthsTo(cycleMonth(input.cycle), Math.ceil(left / monthly));
  if (input.neededBy === null) return { status: 'steady', eta, monthly };
  return { status: eta <= input.neededBy ? 'onTrack' : 'behind', eta, monthly };
}

/** The date a bill falls due inside the cycle: its day in the first month after the cycle starts. */
export function billDueIn(cycle: PayCycle, dueDay: number): LocalDate {
  const { year, month } = parts(cycle.start);
  const inStartMonth = makeDate(year, month, Math.min(dueDay, daysInMonth(year, month)));
  if (inStartMonth > cycle.start) return inStartMonth;
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return makeDate(next.year, next.month, Math.min(dueDay, daysInMonth(next.year, next.month)));
}

/** Where a day sits on the cycle's line, 0 on its first day and 1 on payday. */
export function cyclePosition(cycle: PayCycle, day: LocalDate): number {
  const first = addDays(cycle.start, 1);
  const span = diffDays(cycle.payday, first);
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, diffDays(day, first) / span));
}
