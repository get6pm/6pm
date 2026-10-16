import { floorToStep, VND, type Currency, type Money as Vnd } from '../money/currency';
import { sumCounted, type CountedSpend } from '../spend/spend';

/** The month's plan, as the Plan tab sets it. Every field is a monthly amount. */
export interface MonthPlan {
  /** Money in, after tax. */
  readonly income: Vnd;
  /** Fixed bills set aside first. */
  readonly bills: Vnd;
  /** Future you: paid first on payday. */
  readonly futureYou: Vnd;
  /** Occasions: the sum of every pot's monthly set-aside. */
  readonly occasions: Vnd;
  /** One-off top-ups this cycle to goals and pots (the +100k buttons). */
  readonly topUps: Vnd;
}

export interface DailyNumberInput {
  readonly plan: MonthPlan;
  /** Everything counted in this pay cycle before today, late spends included. */
  readonly spentBefore: Vnd;
  /** Today's spends, in any status. */
  readonly today: readonly CountedSpend[];
  /** Categories that do not count toward the daily number. */
  readonly notDaily: ReadonlySet<string>;
  /** Days after today through payday (see `payCycleOn`). */
  readonly daysLeft: number;
  /**
   * The part of the cycle's free money not yet spent when 6pm started counting: 1, except in the
   * cycle the user joined (see `joinedShare`).
   */
  readonly share?: number;
  /**
   * What the person said they spent between payday and joining, not counting bills: counted in
   * place of the `share`'s estimate. Null or left out in every other cycle (see `joinedCycle`).
   */
  readonly beforeJoining?: Vnd | null;
  /** This cycle sets nothing aside for Future you: it starts at payday (see `joinedCycle`). */
  readonly futureYouSkipped?: boolean;
  /** The home currency: lines floor to its step. Đồng when not given. */
  readonly currency?: Currency;
}

export interface DailyNumber {
  /** Free money at the start of today: income less everything set aside and spent before. */
  readonly startFree: Vnd;
  /** Today's line: an even share of `startFree`, today included; never below zero. */
  readonly line: Vnd;
  /** Counted today. */
  readonly spent: Vnd;
  /** Free money right now. */
  readonly free: Vnd;
  /** What is left of today's line; negative when the day went over. */
  readonly safe: Vnd;
  /** Tomorrow's line if the day ended now. */
  readonly tomorrow: Vnd;
  /**
   * Tomorrow's line dropped below today's and the cycle still has free money: the companion says
   * the month still lands. Never true once the cycle is `overspent`, when it would not.
   */
  readonly replan: boolean;
  /**
   * The cycle's free money is gone: more was spent than it held, so nothing is safe until payday
   * and a day that goes over is not covered by the days after.
   */
  readonly overspent: boolean;
}

/** A joined share as the engine uses it: between none and all, and all when it is not a number. */
export function cleanShare(share: number): number {
  return Number.isFinite(share) ? Math.min(1, Math.max(0, share)) : 1;
}

/**
 * The cycle's free money (income less bills, Future you and occasions) as far as 6pm counts it:
 * scaled by the joined `share` when there is some (M2a). A shortfall is never scaled: bills and
 * Future you stay whole, so the whole of what they take beyond the income still counts.
 */
export function countedFree(planned: Vnd, share: number): Vnd {
  return planned > 0 ? Math.round(planned * cleanShare(share)) : planned;
}

/** Future you as this cycle's number counts it: nothing in a cycle that starts it at payday. */
export function cycleFutureYou(input: Pick<DailyNumberInput, 'plan' | 'futureYouSkipped'>): Vnd {
  return input.futureYouSkipped === true ? 0 : input.plan.futureYou;
}

/**
 * The joined cycle's free money as the engine counts it: the planned free money less what the
 * person said went before they joined, or, with no answer, its `countedFree` estimate (M2a). An
 * answer larger than the free money leaves it below zero, so the cycle starts overspent.
 */
export function joinedFree(planned: Vnd, share: number, beforeJoining?: Vnd | null): Vnd {
  if (beforeJoining == null || !Number.isFinite(beforeJoining)) return countedFree(planned, share);
  return planned - Math.max(0, Math.round(beforeJoining));
}

/**
 * The one number. Free money is split evenly across the days left, today included, and rounded
 * down to a whole step (1.000₫, $1) so the promise is always kept. Once the cycle's free money is
 * gone the line stays at zero until payday (`overspent`), never a negative allowance.
 */
export function dailyNumber(input: DailyNumberInput): DailyNumber {
  const { plan, share = 1, currency = VND } = input;
  const daysLeft = Number.isFinite(input.daysLeft) ? Math.max(0, input.daysLeft) : 0;
  const futureYou = cycleFutureYou(input);
  const planned = plan.income - plan.bills - futureYou - plan.occasions;
  const startFree =
    joinedFree(planned, share, input.beforeJoining) - plan.topUps - input.spentBefore;
  const line = Math.max(0, floorToStep(startFree / (daysLeft + 1), currency));
  const spent = sumCounted(input.today, input.notDaily);
  const free = startFree - spent;
  const tomorrow = daysLeft > 0 ? Math.max(0, floorToStep(free / daysLeft, currency)) : 0;
  const overspent = free < 0;
  return {
    startFree,
    line,
    spent,
    free,
    safe: line - spent,
    tomorrow,
    replan: !overspent && tomorrow < line,
    overspent,
  };
}

/** The meter under the hero: how much of today's line is used, clamped to [0, 1]. */
export function lineUsed(day: DailyNumber): number {
  if (day.line <= 0) return day.spent > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, day.spent / day.line));
}
