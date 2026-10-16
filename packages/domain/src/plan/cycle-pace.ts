import type { Money as Vnd } from '../money/currency';
import { diffDays, type LocalDate } from '../time/local-date';
import type { PayCycle } from './pay-cycle';

/** How far ahead of the days the money may run before the pace is called fast. */
const PACE_SLACK = 0.03;

/**
 * Where the cycle stands: how much of its free money is used, how much of its time is gone, and
 * whether the money keeps up with the days (`steady`) or runs ahead of them (`fast`).
 */
export interface CyclePace {
  readonly used: number;
  readonly gone: number;
  readonly pace: 'steady' | 'fast';
}

/**
 * The cycle's pace on `today`. `spent` and `free` are the cycle's spent and still-free money (the
 * money river's segments), so `used` is the spent share of what the cycle had to spend. `gone`
 * counts today and the payday as cycle days, as the daily number does: Friday 9 October in a cycle
 * from 1 October to payday 31 October is 9 of 31 days gone.
 */
export function cyclePace(input: {
  readonly spent: Vnd;
  readonly free: Vnd;
  readonly cycle: PayCycle;
  readonly today: LocalDate;
}): CyclePace {
  const { spent, free, cycle, today } = input;
  const total = spent + Math.max(0, free);
  const used = total > 0 ? Math.min(1, Math.max(0, spent / total)) : spent > 0 ? 1 : 0;
  const days = diffDays(cycle.payday, cycle.start) + 1;
  const elapsed = diffDays(today, cycle.start) + 1;
  const gone = days > 0 ? Math.min(1, Math.max(0, elapsed / days)) : 1;
  return { used, gone, pace: used > gone + PACE_SLACK ? 'fast' : 'steady' };
}

/**
 * The number a day still ahead would have if today ended now: tomorrow's line for every day after
 * today up to the payday, which the cycle still covers; nothing for a day past it, which belongs
 * to the next cycle, or for today and earlier.
 */
export function lineAhead(
  day: LocalDate,
  today: LocalDate,
  payday: LocalDate,
  tomorrow: Vnd,
): Vnd | null {
  return day > today && day <= payday ? tomorrow : null;
}
