import { designAmount, type Currency, type Money } from '../money/currency';

/** A receipt this big (in đồng, or its worth in the home currency) is offered a split. */
export const SPLIT_FROM_DONG = 500_000;
/** The most people a receipt is split between. */
export const SPLIT_MOST = 20;

/** Whether a receipt's home total is big enough to have been shared, and offered a split. */
export function offersSplit(amount: Money | null, home: Currency): boolean {
  return amount !== null && amount >= designAmount(SPLIT_FROM_DONG, home);
}

/**
 * One person's share of a total split `people` ways, in minor units: rounded up to a whole step
 * (1.000₫ in Vietnam, where nobody hands over 735.250₫), else to the minor unit, so the shares
 * never come to less than the bill.
 */
export function splitShare(total: Money, people: number, home: Currency): Money {
  const ways = Math.min(Math.max(1, Math.round(people)), SPLIT_MOST);
  if (ways === 1) return total;
  const unit = home.code === 'VND' ? home.step : 1;
  return Math.ceil(total / ways / unit) * unit;
}

/** A foreign total ("68.80") split `people` ways, as printed: two decimals at most, rounded up. */
export function splitPrinted(amount: string, people: number): string {
  const ways = Math.min(Math.max(1, Math.round(people)), SPLIT_MOST);
  if (ways === 1) return amount;
  const share = Math.ceil((Number(amount) / ways) * 100 - 1e-9) / 100;
  return String(Number(share.toFixed(2)));
}
