import { ceilToFiftyThousand, floorToThousand, type Vnd } from '../money/format';
import {
  addDays,
  daysInMonth,
  diffDays,
  makeDate,
  parts,
  type LocalDate,
} from '../time/local-date';
import type { PayCycle } from './pay-cycle';

/** The money river's segments, left to right. */
export const RIVER_SEGMENTS = ['bills', 'futureYou', 'occasions', 'spent', 'free'] as const;
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
}

/**
 * Where the month's money goes: bills, Future you (with its top-ups), occasions (with theirs),
 * everything spent so far, and what is still free. The segments add up to the income.
 */
export function moneyRiver(input: RiverInput): Readonly<Record<RiverSegment, Vnd>> {
  const futureYou = input.futureYou + input.goalTopUps;
  const occasions = input.occasions + input.occasionTopUps;
  return {
    bills: input.bills,
    futureYou,
    occasions,
    spent: input.income - input.bills - futureYou - occasions - input.free,
    free: input.free,
  };
}

/**
 * The daily number from tomorrow if Future you got `candidate` instead of `committed`: the
 * difference goes back to (or comes out of) the free money, split over the days left.
 */
export function whatIfDaily(free: Vnd, committed: Vnd, candidate: Vnd, daysLeft: number): Vnd {
  if (daysLeft <= 0) return 0;
  return Math.max(0, floorToThousand((free + committed - candidate) / daysLeft));
}

/** How a day changes per extra amount set aside now: "about 5k a day" for 100k over 22 days. */
export function aboutPerDay(amount: Vnd, daysLeft: number): Vnd {
  if (daysLeft <= 0) return amount;
  return Math.round(amount / daysLeft / 1000) * 1000;
}

/** The day bars' full height: 600k, or the most a day could be with nothing set aside. */
export function dayBarScale(free: Vnd, committed: Vnd, daysLeft: number): Vnd {
  return Math.max(600_000, whatIfDaily(free, committed, 0, daysLeft));
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

/** Months from `today`'s month to `month` ('YYYY-MM'), at least one. */
export function monthsUntil(today: LocalDate, month: string): number {
  const [fy = 0, fm = 0] = monthKey(today).split('-').map(Number);
  const [ty = 0, tm = 0] = month.split('-').map(Number);
  return Math.max(1, (ty - fy) * 12 + (tm - fm));
}

/**
 * An occasion pot's monthly set-aside: what is left, spread over the months to its date, rounded
 * up to 50.000₫. Nothing when it is full or has no date.
 */
export function potMonthlyNeed(goal: Vnd, saved: Vnd, monthsLeft: number | null): Vnd {
  const left = Math.max(0, goal - saved);
  if (left === 0 || monthsLeft === null || monthsLeft <= 0) return 0;
  return ceilToFiftyThousand(left / monthsLeft);
}

/** A goal's share of Future you, each month. */
export function goalMonthly(futureYou: Vnd, share: number): Vnd {
  return Math.round(futureYou * share);
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
 * this month. With a date it is on track when it fills by then; without one it just keeps going.
 */
export function goalPlan(input: {
  readonly goal: Vnd;
  readonly saved: Vnd;
  readonly monthly: Vnd;
  readonly neededBy: string | null;
  readonly today: LocalDate;
}): GoalPlan {
  const left = Math.max(0, input.goal - input.saved);
  const { monthly } = input;
  if (left === 0) return { status: 'reached', eta: null, monthly };
  if (monthly <= 0) return { status: 'paused', eta: null, monthly };
  const eta = addMonthsTo(monthKey(input.today), Math.ceil(left / monthly));
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
