import type { MaxState } from './purchases-port';

/** The one date worth telling a Max customer, and what it is the date of. */
export interface MaxStatus {
  readonly kind: 'trialEnds' | 'renews' | 'ends';
  /** Epoch milliseconds, from the store. */
  readonly at: number;
}

/**
 * While a trial runs, when it ends (that is when the first charge is made); then when the plan
 * renews; or, once cancelled, when Max runs out. Null when Max is off or the store gave no date.
 */
export function maxStatus(max: MaxState): MaxStatus | null {
  if (!max.active) return null;
  if (max.inTrial && max.trialEndsAt !== null) return { kind: 'trialEnds', at: max.trialEndsAt };
  if (max.renewsAt !== null) return { kind: 'renews', at: max.renewsAt };
  if (max.endsAt !== null) return { kind: 'ends', at: max.endsAt };
  return null;
}
