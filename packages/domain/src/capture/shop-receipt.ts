import { travelCurrency } from '../travel/currencies';
import { readReceiptTime, toRows, type ReceiptLine, type Row } from './bank-receipt';
import { readReceiptCurrency, type CurrencyHints, type CurrencySource } from './receipt-currency';
import { readShopName } from './receipt-merchant';
import { foldWords } from './spoken-spend';
import {
  TOTAL_RANK,
  lastAmount,
  printsCents,
  shopLabelOf,
  type PrintedAmount,
  type ShopLabel,
} from './shop-labels';

export interface ShopReceipt {
  /** What was paid, as a decimal in the receipt's currency ("68.8", "101500"); null if unread. */
  readonly total: string | null;
  /** ISO 4217; null when the amounts are not đồng and nothing says what they are. */
  readonly currency: string | null;
  /** The receipt printed its currency (or is plainly Vietnamese); false when it was inferred. */
  readonly currencySure: boolean;
  /** What decided the currency. */
  readonly currencyFrom: CurrencySource;
  /**
   * A total label was read and nothing on the receipt argues with it: no second total of the
   * same kind with another amount, no card charge or subtotal that disagrees.
   */
  readonly totalSure: boolean;
  /** The row of `receiptReadingOrder` the total was read from; null when worked out or unread. */
  readonly totalLine: number | null;
  /** The shop's name from the header, as printed; empty when none reads as one. */
  readonly merchant: string;
  /** When it was printed (ISO 8601), as the phone's local time. */
  readonly at: string | null;
}

interface Labelled {
  readonly row: number;
  readonly kind: ShopLabel;
  readonly amount: PrintedAmount | null;
  readonly height: number;
}

/** Each row's label (in any cell) and the amount printed after it on the same row. */
function labelledRows(rows: readonly Row[]): Labelled[] {
  const found: Labelled[] = [];
  rows.forEach((row, index) => {
    const at = row.cells.findIndex((cell) => shopLabelOf(cell) !== null);
    if (at < 0) return;
    const kind = shopLabelOf(row.cells[at] ?? '') as ShopLabel;
    const amount = lastAmount(row.cells.slice(at).join(' '));
    found.push({ row: index, kind, amount, height: row.height });
  });
  return found;
}

/** Whole-unit currencies: an amount with cents, or under a thousand đồng, is a misread. */
function plausible(amount: PrintedAmount | null, currency: string | null): amount is PrintedAmount {
  if (amount === null || amount.value <= 0) return false;
  if (currency === null) return true;
  const whole = currency === 'VND' || travelCurrency(currency)?.decimals === 0;
  if (whole && (amount.cents || !Number.isInteger(amount.value))) return false;
  return currency !== 'VND' || amount.value >= 1000;
}

/** A tax or service line anywhere, even where the row does not start with its label. */
const TAXED = / (?:vat|vai|tax|gst|thue|service|phi dich vu|phi phuc vu|pajak|svc) /;

const PRICE = /\d[.,]\d{3}(?!\d)|\d[.,]\d{2}(?![\d.,])/;

/** The amount printed tallest anywhere but on a discount, tax or change line. */
function tallestAmount(
  rows: readonly Row[],
  skip: ReadonlySet<number>,
  currency: string | null,
): { amount: PrintedAmount; row: number } | null {
  let best: { amount: PrintedAmount; row: number; height: number } | null = null;
  rows.forEach((row, index) => {
    if (skip.has(index)) return;
    const amount = lastAmount(row.cells.join(' '));
    if (!plausible(amount, currency) || !PRICE.test(row.cells.join(' '))) return;
    if (!best || row.height > best.height) best = { amount, row: index, height: row.height };
  });
  return best;
}

const sum = (items: readonly Labelled[]) =>
  items.reduce((total, item) => total + (item.amount?.value ?? 0), 0);
const same = (a: number, b: number) => Math.abs(a - b) < 0.005;

interface Picked {
  readonly value: number;
  readonly line: number | null;
  readonly sure: boolean;
}

/**
 * The total: the strongest total label with a readable amount, the lowest on the page when it is
 * printed more than once ("Tổng cộng" then "Còn lại"). With none, subtotal less discounts, then
 * the subtotal, then what the card was charged, then the amount printed largest; all unsure.
 */
function pickTotal(rows: readonly Row[], labelled: readonly Labelled[], currency: string | null) {
  const usable = labelled.filter((item) => plausible(item.amount, currency));
  const of = (kind: ShopLabel) => usable.filter((item) => item.kind === kind);
  const ranked = usable
    .filter((item) => TOTAL_RANK[item.kind] !== undefined)
    .sort((a, b) => (TOTAL_RANK[b.kind] ?? 0) - (TOTAL_RANK[a.kind] ?? 0) || b.row - a.row);
  const subtotal = of('subtotal').at(-1)?.amount?.value;
  const discounts = sum(of('discount'));
  const paid = of('paid').map((item) => item.amount?.value ?? 0);
  const top = ranked[0];
  if (top?.amount) {
    const value = top.amount.value;
    const rivals = ranked.filter(
      (item) => item.kind === top.kind && !same(item.amount?.value ?? 0, value),
    );
    const taxed = rows.some((row) => TAXED.test(foldWords(row.cells.join(' '))));
    const paidDisagrees = paid.length > 0 && !paid.some((charged) => same(charged, value));
    const subtotalDisagrees =
      subtotal !== undefined &&
      !taxed &&
      !same(subtotal, value) &&
      !same(subtotal - discounts, value);
    const sure = rivals.length === 0 && !paidDisagrees && !subtotalDisagrees;
    return { value, line: top.row, sure } satisfies Picked;
  }
  if (subtotal !== undefined && discounts > 0 && discounts < subtotal) {
    return { value: subtotal - discounts, line: null, sure: false } satisfies Picked;
  }
  const fallback = of('subtotal').at(-1) ?? of('paid').at(-1);
  if (fallback?.amount) return { value: fallback.amount.value, line: fallback.row, sure: false };
  const skip = new Set(labelled.map((item) => item.row));
  const tallest = tallestAmount(rows, skip, currency);
  return tallest ? { value: tallest.amount.value, line: tallest.row, sure: false } : null;
}

/** A decimal string with no float noise: 68.8 → "68.8", 101500 → "101500". */
function decimalOf(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * Reads a paper or screen receipt from a shop or restaurant: the total from its labels (in
 * Vietnamese, English and Indonesian), discounts, change, cash handed over and tax lines never
 * taken for it; the currency from the receipt itself, then the `hints` (where the photo was
 * taken, the trip); the shop's name from the header. Null when nothing on it is labelled like a
 * shop receipt.
 */
export function parseShopReceipt(
  lines: readonly ReceiptLine[],
  hints: CurrencyHints,
): ShopReceipt | null {
  const rows = toRows(lines);
  const labelled = labelledRows(rows);
  if (!labelled.some((item) => item.kind !== 'other')) return null;
  const texts = rows.map((row) => row.cells.join(' '));
  const {
    currency,
    sure: currencySure,
    from: currencyFrom,
  } = readReceiptCurrency(texts, printsCents(texts), hints);
  const picked = pickTotal(rows, labelled, currency);
  const firstPrice = texts.findIndex((text) => PRICE.test(text));
  const at = texts.map(readReceiptTime).find((read) => read !== null) ?? null;
  return {
    total: picked ? decimalOf(picked.value) : null,
    currency,
    currencySure,
    currencyFrom,
    totalSure: picked?.sure ?? false,
    totalLine: picked?.line ?? null,
    merchant: readShopName(rows, firstPrice < 0 ? rows.length : firstPrice),
    at,
  };
}
