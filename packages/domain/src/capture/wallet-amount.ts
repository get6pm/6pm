/** An amount as a payment app printed it, in its own currency. */
export interface WalletAmount {
  /** ISO 4217, upper case: "VND", "USD". */
  readonly currency: string;
  /** Whole minor units of that currency: đồng for VND (it has none smaller), cents for USD. */
  readonly amount: number;
}

/** Symbols and codes as payment apps print them, longest first so "US$" wins over "$". */
const CURRENCY_MARKS: readonly (readonly [RegExp, string])[] = [
  [/vnđ|vnd|₫|đồng|\d\s?đ(?!\p{L})/iu, 'VND'],
  [/us\$|usd/i, 'USD'],
  [/s\$|sgd/i, 'SGD'],
  [/a\$|aud/i, 'AUD'],
  [/eur|€/i, 'EUR'],
  [/gbp|£/i, 'GBP'],
  [/jpy|¥/i, 'JPY'],
  [/krw|₩/i, 'KRW'],
  [/thb|฿/i, 'THB'],
  [/\$/, 'USD'],
];

/** Currencies with no minor unit in daily use; every other one has two decimals. */
const WHOLE_CURRENCIES = new Set(['VND', 'JPY', 'KRW']);

/**
 * Reads the amount a payment app hands over, such as the Wallet automation's "Amount":
 * "₫45,000", "45.000 ₫", "VND 45,000.00", "45000", "$3.50". With no currency mark it is đồng, taken
 * as written (unlike a typed amount, "45" is 45₫). Returns null when nothing is readable or the
 * amount is zero: Wallet passes "0.0" or nothing when it could not read the card's amount.
 */
export function parseWalletAmount(text: string): WalletAmount | null {
  const s = text.normalize('NFC').trim();
  if (s === '') return null;
  const currency = CURRENCY_MARKS.find(([mark]) => mark.test(s))?.[1] ?? 'VND';
  const digits = /\d(?:[\d.,'\s]*\d)?/.exec(s)?.[0];
  if (digits === undefined) return null;
  const value = readPrintedNumber(digits);
  if (value === null || value <= 0) return null;
  const scale = WHOLE_CURRENCIES.has(currency) ? 1 : 100;
  const amount = Math.round(value * scale);
  return amount > 0 && Number.isSafeInteger(amount) ? { currency, amount } : null;
}

/**
 * A printed number with either convention: "45,000.00" and "45.000,00" are both 45000. When only
 * one kind of separator appears, it groups thousands if every group after it has three digits
 * ("45.000", "1,250,000"), and is a decimal point otherwise ("3.50", "0.0").
 */
export function readPrintedNumber(raw: string): number | null {
  const s = raw.replace(/[\s']/g, '');
  if (!/^\d[\d.,]*$/.test(s) || /[.,]$/.test(s)) return null;
  const decimalAt = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  if (decimalAt < 0) return Number(s);
  const mixed = s.includes('.') && s.includes(',');
  const groups = s.split(/[.,]/);
  const grouped =
    (groups[0] ?? '').length <= 3 && groups.slice(1).every((group) => group.length === 3);
  if (!mixed && grouped) return Number(groups.join(''));
  if (!mixed && groups.length > 2) return null;
  const integer = s.slice(0, decimalAt).replace(/[.,]/g, '');
  return Number(`${integer}.${s.slice(decimalAt + 1)}`);
}
