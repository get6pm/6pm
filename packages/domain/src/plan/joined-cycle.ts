import {
  ceilToSetAside,
  floorToStep,
  VND,
  type Currency,
  type Money as Vnd,
} from '../money/currency';
import type { LocalDate } from '../time/local-date';
import { countedFree } from './daily-number';
import { joinedShare, payCycleOn, type PayCycle, type Payday } from './pay-cycle';

/** What the person told 6pm about the cycle they joined, as the plan keeps it. */
export interface JoinedAnswers {
  /** The day 6pm was set up; null when unknown. */
  readonly on: LocalDate | null;
  /** "Since payday, about how much have you spent? Not counting bills." Null when not answered. */
  readonly spentSincePayday?: Vnd | null | undefined;
  /** "Start Future you at payday": the joined cycle sets nothing aside for Future you. */
  readonly futureYouAtPayday?: boolean | undefined;
}

/** How one pay cycle counts what went before the person joined. */
export interface JoinedCycle {
  /** This is the cycle the person joined part-way through. */
  readonly joined: boolean;
  /**
   * The share of the cycle's free money the estimate leaves: 1 outside the joined cycle, and 1
   * once the person answered, since their amount then stands in for the estimate whole.
   */
  readonly share: number;
  /** What the person said went before they joined; null for the estimate or another cycle. */
  readonly beforeJoining: Vnd | null;
  /** This cycle sets nothing aside for Future you. */
  readonly futureYouSkipped: boolean;
}

/** Whether `cycle` is the one the person joined part-way through (joining on payday is not). */
export function isJoinedCycle(cycle: PayCycle, joinedOn: LocalDate | null): boolean {
  return joinedOn !== null && joinedOn > cycle.start;
}

/**
 * How `cycle` counts the time before joining (M2a): the person's answer in place of the estimate
 * when there is one, the estimate's share when there is not, and every later cycle whole.
 */
export function joinedCycle(cycle: PayCycle, answers: JoinedAnswers): JoinedCycle {
  if (!isJoinedCycle(cycle, answers.on)) {
    return { joined: false, share: 1, beforeJoining: null, futureYouSkipped: false };
  }
  const answer = answers.spentSincePayday;
  const answered = answer != null && Number.isFinite(answer);
  return {
    joined: true,
    share: answered ? 1 : joinedShare(cycle, answers.on),
    beforeJoining: answered ? Math.max(0, Math.round(answer)) : null,
    futureYouSkipped: answers.futureYouAtPayday === true,
  };
}

/** Future you's amount in a cycle: nothing when that cycle skips it. */
export function futureYouIn(futureYou: Vnd, joined: Pick<JoinedCycle, 'futureYouSkipped'>): Vnd {
  return joined.futureYouSkipped ? 0 : futureYou;
}

/**
 * The first day Future you sets money aside when the person chose to start it at payday: the
 * payday that ends the cycle they joined. Null when every cycle sets it aside.
 */
export function futureYouStartsOn(
  payday: Payday,
  answers: Pick<JoinedAnswers, 'on' | 'futureYouAtPayday'>,
): LocalDate | null {
  if (answers.futureYouAtPayday !== true || answers.on === null) return null;
  const cycle = payCycleOn(answers.on, payday);
  return isJoinedCycle(cycle, answers.on) ? cycle.payday : null;
}

/**
 * The prefill for "spent since payday": the part of the planned free money (income less bills,
 * Future you and occasions) the estimate takes as gone, so leaving it as it is changes nothing.
 * Rounded down to a step, never below zero.
 */
export function spentSincePaydayEstimate(
  planned: Vnd,
  share: number,
  currency: Currency = VND,
): Vnd {
  const gone = planned - countedFree(planned, share);
  return Math.max(0, floorToStep(gone, currency));
}

/**
 * Amounts to pick from beside the keypad: the estimate and a quarter, half and three quarters of
 * the planned free money, each rounded up to fifty steps, smallest first, none repeated.
 */
export function spentSincePaydayPresets(
  planned: Vnd,
  estimate: Vnd,
  currency: Currency = VND,
): Vnd[] {
  const free = Math.max(0, planned);
  const parts = [0.25, 0.5, 0.75].map((k) => ceilToSetAside(free * k, currency));
  return [...new Set([estimate, ...parts].filter((v) => v > 0))].sort((a, b) => a - b);
}
