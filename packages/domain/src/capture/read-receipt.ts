import { currencyOf, type Money } from '../money/currency';
import { foreignToHome } from '../travel/home-fx';
import { parseBankReceipt, readFields, toRows, type Field, type ReceiptLine } from './bank-receipt';
import type { CurrencySource } from './receipt-currency';
import { parseShopReceipt } from './shop-receipt';
import { foldWords } from './spoken-spend';

/** A receipt in a currency other than home, as printed: "SGD" and "68.8". */
export interface ForeignPrinted {
  readonly currency: string;
  /** A decimal string in that currency's units. */
  readonly amount: string;
}

/** Whatever was shared, read: a bank transfer screenshot or a shop's receipt. */
export interface ReadReceipt {
  readonly kind: 'transfer' | 'shop';
  /** In the home currency's minor units; null when unread or in another currency. */
  readonly amount: Money | null;
  /** The amount in its own currency, for a receipt that is not in the home currency. */
  readonly foreign: ForeignPrinted | null;
  /** ISO 4217; null when the amounts clearly cannot be home's and nothing says what they are. */
  readonly currency: string | null;
  /** The total as printed, a decimal in the receipt's own units, whatever its currency. */
  readonly printed: string | null;
  readonly currencySure: boolean;
  /** What decided the currency: anything but `printed` is a guess. */
  readonly currencyFrom: CurrencySource;
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

/** A total printed in the home currency, in its minor units; null with decimals home lacks. */
function homeAmountOf(total: string, home: string): Money | null {
  const currency = currencyOf(home);
  if (currency.minorDigits === 0 && total.includes('.')) return null;
  return foreignToHome(total, '1', currency);
}

/**
 * Reads a shared receipt. Transfer screenshots are read as before (Vietnamese banks, always
 * đồng: on a phone counting another currency their amount is a foreign one); anything else
 * labelled like a shop's bill is read for its total and its currency. When the receipt prints no
 * currency, `located` (the currency where the photo was taken) is the first guess and `prior`
 * (the trip's currency in Travel mode) the last before `home`.
 */
export function readReceipt(
  lines: readonly ReceiptLine[],
  prior: string | null = null,
  located: string | null = null,
  home = 'VND',
): ReadReceipt | null {
  const shop = readsAsTransfer(lines) ? null : parseShopReceipt(lines, { prior, located, home });
  if (shop) {
    const inHome = shop.currency === home && shop.total !== null;
    const abroad = shop.currency !== null && shop.currency !== home && shop.total !== null;
    return {
      kind: 'shop',
      amount: inHome && shop.total !== null ? homeAmountOf(shop.total, home) : null,
      foreign: abroad ? { currency: shop.currency, amount: shop.total } : null,
      currency: shop.currency,
      printed: shop.total,
      currencySure: shop.currencySure,
      currencyFrom: shop.currencyFrom,
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
  const dong = bank.amount !== null && home !== 'VND' ? String(bank.amount) : null;
  return {
    kind: 'transfer',
    ...bank,
    amount: home === 'VND' ? bank.amount : null,
    foreign: dong === null ? null : { currency: 'VND', amount: dong },
    currency: 'VND',
    printed: bank.amount === null ? null : String(bank.amount),
    currencySure: true,
    currencyFrom: 'printed',
    totalSure: bank.amount !== null,
    totalLine: null,
  };
}
