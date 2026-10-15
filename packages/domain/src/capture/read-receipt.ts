import type { Vnd } from '../money/format';
import { parseBankReceipt, readFields, toRows, type Field, type ReceiptLine } from './bank-receipt';
import { parseShopReceipt } from './shop-receipt';
import { foldWords } from './spoken-spend';

/** A receipt in a currency other than đồng, as printed: "SGD" and "68.8". */
export interface ForeignPrinted {
  readonly currency: string;
  /** A decimal string in that currency's units. */
  readonly amount: string;
}

/** Whatever was shared, read: a bank transfer screenshot or a shop's receipt. */
export interface ReadReceipt {
  readonly kind: 'transfer' | 'shop';
  /** In đồng; null when unread or when the receipt is in another currency. */
  readonly amount: Vnd | null;
  /** The amount in its own currency, for a receipt that is not in đồng. */
  readonly foreign: ForeignPrinted | null;
  /** ISO 4217; null when the amounts are clearly not đồng and nothing says what they are. */
  readonly currency: string | null;
  /** The total as printed, a decimal in the receipt's own units, whatever its currency. */
  readonly printed: string | null;
  readonly currencySure: boolean;
  readonly totalSure: boolean;
  /** The row of `receiptReadingOrder` the amount was read from, when one was. */
  readonly totalLine: number | null;
  readonly payee: string;
  readonly payeeSure: boolean;
  readonly at: string | null;
  readonly code: string | null;
  readonly bank: string | null;
}

/** Card slips print reference numbers too; only a transfer says who received the money. */
const TRANSFER_FIELDS: readonly Field[] = ['payee', 'toBank'];
const TRANSFER_WORDS = / (?:chuyen tien|chuyen khoan thanh cong|giao dich thanh cong|transfer) /;

/** A bank or wallet transfer names who was paid, or says it is a transfer. */
function readsAsTransfer(lines: readonly ReceiptLine[]): boolean {
  const rows = toRows(lines);
  const { fields } = readFields(rows);
  if (TRANSFER_FIELDS.some((field) => fields.has(field))) return true;
  return TRANSFER_WORDS.test(foldWords(rows.map((row) => row.cells.join(' ')).join(' ')));
}

/**
 * Reads a shared receipt. Transfer screenshots are read as before (always đồng); anything else
 * labelled like a shop's bill is read for its total and its currency. When the receipt prints no
 * currency, `located` (the currency where the photo was taken) is the first guess and `prior`
 * (the trip's currency in Travel mode) the last before đồng.
 */
export function readReceipt(
  lines: readonly ReceiptLine[],
  prior: string | null = null,
  located: string | null = null,
): ReadReceipt | null {
  const shop = readsAsTransfer(lines) ? null : parseShopReceipt(lines, { prior, located });
  if (shop) {
    const inDong = shop.currency === 'VND' && shop.total !== null;
    const abroad = shop.currency !== null && shop.currency !== 'VND' && shop.total !== null;
    return {
      kind: 'shop',
      amount: inDong ? Number(shop.total) : null,
      foreign: abroad ? { currency: shop.currency, amount: shop.total } : null,
      currency: shop.currency,
      printed: shop.total,
      currencySure: shop.currencySure,
      totalSure: shop.totalSure,
      totalLine: shop.totalLine,
      payee: shop.merchant,
      // A header is a guess at the shop's name: the app names it from the lines when it can.
      payeeSure: false,
      at: shop.at,
      code: null,
      bank: null,
    };
  }
  const bank = parseBankReceipt(lines);
  if (!bank) return null;
  return {
    kind: 'transfer',
    ...bank,
    foreign: null,
    currency: 'VND',
    printed: bank.amount === null ? null : String(bank.amount),
    currencySure: true,
    totalSure: bank.amount !== null,
    totalLine: null,
  };
}
