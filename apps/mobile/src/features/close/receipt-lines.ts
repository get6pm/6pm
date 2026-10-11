import { countsTowardDay, type SpendRow } from '@6pm/domain';

export interface ReceiptSpends {
  /** Printed lines, oldest first. They add up to the receipt's total. */
  readonly lines: readonly SpendRow[];
  /** The one spend moved to Claim back, printed under the total's lines. */
  readonly claimBack: SpendRow | null;
}

/**
 * The spends a day's receipt prints: what the day kept and counted. A category set to not count
 * toward the daily number, and a spend sent to Claim back, are not in the total, so they are not
 * lines either; the lines always add up to the total.
 */
export function receiptSpends(
  spends: readonly SpendRow[],
  day: string,
  notDaily: ReadonlySet<string>,
): ReceiptSpends {
  const kept = spends
    .filter((s) => s.day === day && s.status === 'kept')
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return {
    lines: kept.filter((s) =>
      countsTowardDay(
        { amount: s.amount, category: s.categoryId, status: s.status, forWork: s.forWork },
        notDaily,
      ),
    ),
    claimBack: kept.find((s) => s.forWork) ?? null,
  };
}
