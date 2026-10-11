import { floorToThousand, type Vnd } from '../money/format';
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
}

export interface DailyNumber {
  /** Free money at the start of today: income less everything set aside and spent before. */
  readonly startFree: Vnd;
  /** Today's line: an even share of `startFree`, today included. */
  readonly line: Vnd;
  /** Counted today. */
  readonly spent: Vnd;
  /** Free money right now. */
  readonly free: Vnd;
  /** What is left of today's line; negative when the day went over. */
  readonly safe: Vnd;
  /** Tomorrow's line if the day ended now. */
  readonly tomorrow: Vnd;
  /** Tomorrow's line dropped below today's: the companion says the month still lands. */
  readonly replan: boolean;
}

/**
 * The one number. Free money is split evenly across the days left, today included, and rounded
 * down to whole thousands so the promise is always kept.
 */
export function dailyNumber(input: DailyNumberInput): DailyNumber {
  const { plan, daysLeft, share = 1 } = input;
  const planned = plan.income - plan.bills - plan.futureYou - plan.occasions;
  const startFree = Math.round(planned * share) - plan.topUps - input.spentBefore;
  const line = floorToThousand(startFree / (daysLeft + 1));
  const spent = sumCounted(input.today, input.notDaily);
  const free = startFree - spent;
  const tomorrow = daysLeft > 0 ? Math.max(0, floorToThousand(free / daysLeft)) : 0;
  return {
    startFree,
    line,
    spent,
    free,
    safe: line - spent,
    tomorrow,
    replan: tomorrow < line,
  };
}

/** The meter under the hero: how much of today's line is used, clamped to [0, 1]. */
export function lineUsed(day: DailyNumber): number {
  if (day.line <= 0) return day.spent > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, day.spent / day.line));
}
