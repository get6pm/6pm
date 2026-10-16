import type { Vnd } from '../money/format';

/** Where a spend came from. Shown on cards, rows and the source trail. */
export type SpendSource = 'manual' | 'voice' | 'shared' | 'qr' | 'email' | 'applePay' | 'cash';

/**
 * Where a spend is in its life:
 * - `caught`: arrived on its own and waits for the close,
 * - `pending`: a QR handed off to a bank app, not yet confirmed as paid,
 * - `kept`: confirmed by the user,
 * - `skipped`: "Not mine" — stays visible, struck through, never counted,
 * - `deleted`: removed; kept briefly so it can be undone.
 */
export type SpendStatus = 'caught' | 'pending' | 'kept' | 'skipped' | 'deleted';

/** The fields the daily number reads. Storage rows carry more. */
export interface CountedSpend {
  readonly amount: Vnd;
  readonly category: string;
  readonly status: SpendStatus;
  /** Marked "for work" in the close: moves to Claim back, out of the daily number. */
  readonly forWork?: boolean;
  /** Paid a bill (its id) or a card or loan with none: the bill already came off the plan. */
  readonly paysBill?: string | null | undefined;
}

/**
 * Whether a spend lowers the daily number. Caught and pending spends count until the user says
 * otherwise, so the number never flatters the day; skipped, deleted and work spends never count,
 * nor does paying a bill (the bill came off the plan already), nor categories the user marked as
 * not daily.
 */
export function countsTowardDay(spend: CountedSpend, notDaily: ReadonlySet<string>): boolean {
  if (spend.status === 'skipped' || spend.status === 'deleted') return false;
  if (spend.forWork === true) return false;
  if (spend.paysBill != null) return false;
  return !notDaily.has(spend.category);
}

export function sumCounted(spends: readonly CountedSpend[], notDaily: ReadonlySet<string>): Vnd {
  let total = 0;
  for (const spend of spends) if (countsTowardDay(spend, notDaily)) total += spend.amount;
  return total;
}

/** Spends the close walks through: everything still waiting for a yes. */
export function needsReview(spend: { readonly status: SpendStatus }): boolean {
  return spend.status === 'caught' || spend.status === 'pending';
}
