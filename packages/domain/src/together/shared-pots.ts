import type { Vnd } from '../money/format';
import { cycleMonth, type PayCycle } from '../plan/pay-cycle';
import { monthsBetween, potMonthlyNeed } from '../plan/plan-river';

/**
 * Shared pots only count, like every pot: 6pm never moves money. Each partner says what they put
 * in, and the pot adds both up.
 */

/** The most one pot's goal, or one contribution, can be: a thousand billion đồng. */
export const MAX_SHARED_AMOUNT: Vnd = 1_000_000_000_000;

/** The most pots one pair keeps, and the most contributions one pot keeps. */
export const MAX_SHARED_POTS = 24;
export const MAX_POT_CONTRIBUTIONS = 2000;

/** How long an invite link works. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface ContributionLike {
  readonly memberId: string;
  readonly amount: Vnd;
}

export interface SharedPotProgress {
  /** Everything both partners have put in. */
  readonly saved: Vnd;
  /** Put in per member id; a member who has added nothing is there with 0. */
  readonly byMember: Readonly<Record<string, Vnd>>;
  /** What is still missing, never below zero. */
  readonly left: Vnd;
  /** 0–1 towards the goal. */
  readonly progress: number;
  readonly full: boolean;
}

/** Adds a shared pot up, per partner and together. */
export function sharedPotProgress(
  goal: Vnd,
  contributions: readonly ContributionLike[],
  memberIds: readonly string[] = [],
): SharedPotProgress {
  const byMember: Record<string, Vnd> = {};
  for (const id of memberIds) byMember[id] = 0;
  let saved = 0;
  for (const c of contributions) {
    saved += c.amount;
    byMember[c.memberId] = (byMember[c.memberId] ?? 0) + c.amount;
  }
  const left = Math.max(0, goal - saved);
  const progress = goal > 0 ? Math.min(1, saved / goal) : 0;
  return { saved, byMember, left, progress, full: goal > 0 && left === 0 };
}

/** What a quick top-up adds: the step, or only what is left when that is less. */
export function sharedTopUp(goal: Vnd, saved: Vnd, step: Vnd): Vnd {
  return Math.max(0, Math.min(step, goal - saved));
}

/**
 * What the pot still needs each month, both partners together: what is left spread over the
 * months to its date and rounded up to 50.000₫, as an occasion pot. No date, or past it, nothing.
 */
export function sharedPotMonthly(
  goal: Vnd,
  saved: Vnd,
  neededBy: string | null,
  cycle: PayCycle,
): Vnd {
  if (neededBy === null || cycleMonth(cycle) > neededBy) return 0;
  return potMonthlyNeed(goal, saved, monthsBetween(cycleMonth(cycle), neededBy));
}

/** The smallest amount the add stepper offers. */
export const MIN_STEP_AMOUNT: Vnd = 50_000;

/**
 * The add stepper's next amount: 50.000₫ steps below 1tr, 100.000₫ below 5tr, 500.000₫ above;
 * never below 50.000₫ nor past the cap.
 */
export function stepContribution(amount: Vnd, by: 1 | -1): Vnd {
  const from = by > 0 ? amount : amount - 1;
  const step = from >= 5_000_000 ? 500_000 : from >= 1_000_000 ? 100_000 : 50_000;
  return Math.min(MAX_SHARED_AMOUNT, Math.max(MIN_STEP_AMOUNT, amount + by * step));
}

/** Whether a contribution can go in: whole đồng, more than nothing, within the cap. */
export function isSharedAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_SHARED_AMOUNT;
}
