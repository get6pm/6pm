import { needsReview, type SpendStatus } from '../spend/spend';

export interface QueueSpend {
  readonly id: string;
  readonly day: string;
  readonly at: string;
  readonly status: SpendStatus;
}

/**
 * What tonight's close walks through: everything still waiting for a yes on the closing day or
 * any day before it, oldest first. Waiting items from earlier days join tonight's close, so
 * nothing that counts toward the number is ever out of reach.
 */
export function closeQueue<T extends QueueSpend>(spends: readonly T[], closingDay: string): T[] {
  return spends
    .filter((spend) => spend.day <= closingDay && needsReview(spend))
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}
