import { foreignText, toDecimal } from '../native/share-amount';

/**
 * A spend's foreign amount as the receipt printed it: "Rp496.650", "S$68,80", or "68.80 CHF"
 * for a currency 6pm has no symbol for. Rounded to the currency's own decimals.
 */
export function foreignAmountText(foreign: {
  readonly currency: string;
  readonly amount: number;
}): string {
  const decimal = toDecimal(foreign.amount, foreign.currency) ?? '0';
  return foreignText(decimal, foreign.currency);
}
