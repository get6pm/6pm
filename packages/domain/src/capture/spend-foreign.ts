import { VND } from '../money/currency';
import { toDecimal } from '../native/share-amount';
import { writeForeign, type WritingStyle } from '../native/context-money';

/**
 * A spend's foreign amount as the receipt printed it: "Rp496.650", "S$68,80", or "68.80 CHF"
 * for a currency 6pm has no symbol for. Rounded to the currency's own decimals. Without a
 * `style` it is written as a phone counting đồng writes it.
 */
export function foreignAmountText(
  foreign: { readonly currency: string; readonly amount: number },
  style: WritingStyle = { home: VND, language: 'en' },
): string {
  const decimal = toDecimal(foreign.amount, foreign.currency) ?? '0';
  return writeForeign(decimal, foreign.currency, style);
}

export type { WritingStyle } from '../native/context-money';
