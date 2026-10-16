import type { Money as Vnd } from '../money/currency';
import type { DailyNumber } from './daily-number';

/**
 * What the Plan's heading says was set aside: bills and Future you, bills with Future you
 * starting at payday (skipped in the cycle the person joined), or bills alone.
 */
export type LedeSetAside = 'futureYou' | 'futureYouAtPayday' | 'billsOnly';

/**
 * What it says is left: the free money and its daily line; the free money with no daily line
 * left to give (the last day); all of it spent; or the cycle gone past its plan.
 */
export type LedeLeft = 'daily' | 'untilPayday' | 'allSpent' | 'pastPlan';

export interface PlanLede {
  readonly setAside: LedeSetAside;
  readonly left: LedeLeft;
  /** How far past the plan the cycle is; 0 unless `pastPlan`. */
  readonly over: Vnd;
}

/**
 * The Plan's heading for today's numbers. It never promises a line of nothing a day, never calls
 * an overspent cycle's shortfall money that is left, and never says Future you got paid in a
 * cycle that skipped it.
 */
export function planLede(
  futureYou: { readonly planned: Vnd; readonly skipped: boolean },
  day: Pick<DailyNumber, 'free' | 'tomorrow' | 'overspent'>,
): PlanLede {
  const setAside: LedeSetAside =
    futureYou.planned <= 0 ? 'billsOnly' : futureYou.skipped ? 'futureYouAtPayday' : 'futureYou';
  if (day.overspent || day.free < 0) {
    return { setAside, left: 'pastPlan', over: Math.max(0, -day.free) };
  }
  const left: LedeLeft = day.free === 0 ? 'allSpent' : day.tomorrow > 0 ? 'daily' : 'untilPayday';
  return { setAside, left, over: 0 };
}
