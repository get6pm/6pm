import { currencyOf, type Currency, VND } from '../money/currency';
import type { ForeignScheme } from '../vietqr/foreign-scheme';
import { COUNTRY_CURRENCY } from './countries';

export { COUNTRY_CURRENCY } from './countries';

/** A currency Travel mode can show and convert. */
export interface TravelCurrency {
  /** ISO 4217 alphabetic code: "THB". */
  readonly code: string;
  /** What a person writes in front of the amount: "฿". */
  readonly symbol: string;
  /**
   * Decimals as prices are written there. Cambodia, Indonesia, Laos and Taiwan have official cents
   * nobody uses, so they are entered and shown in whole units, like đồng. Three-decimal dinars are
   * entered to two: a thousandth of a dinar is less than a cent.
   */
  readonly decimals: 0 | 2;
  /**
   * ISO 4217 numeric code, as an EMV QR carries it in tag 53: "764". Empty for a currency whose
   * QRs Scan does not read.
   */
  readonly numeric: string;
}

const currency = (code: string, symbol: string, decimals: 0 | 2, numeric: string) =>
  ({ code, symbol, decimals, numeric }) satisfies TravelCurrency;

/**
 * The currencies Travel mode was designed around, with the symbols a traveller from Vietnam
 * tells apart ("S$", "CN¥") and the numeric codes their QRs carry. Any other currency travels too
 * (`travelCurrency`), with its symbol from the currency table.
 */
export const TRAVEL_CURRENCIES: Readonly<Record<string, TravelCurrency>> = {
  THB: currency('THB', '฿', 2, '764'),
  SGD: currency('SGD', 'S$', 2, '702'),
  MYR: currency('MYR', 'RM', 2, '458'),
  KHR: currency('KHR', '៛', 0, '116'),
  LAK: currency('LAK', '₭', 0, '418'),
  IDR: currency('IDR', 'Rp', 0, '360'),
  PHP: currency('PHP', '₱', 2, '608'),
  JPY: currency('JPY', '¥', 0, '392'),
  KRW: currency('KRW', '₩', 0, '410'),
  CNY: currency('CNY', 'CN¥', 2, '156'),
  TWD: currency('TWD', 'NT$', 0, '901'),
  HKD: currency('HKD', 'HK$', 2, '344'),
  USD: currency('USD', '$', 2, '840'),
  AUD: currency('AUD', 'A$', 2, '036'),
  EUR: currency('EUR', '€', 2, '978'),
  GBP: currency('GBP', '£', 2, '826'),
};

export const TRAVEL_CURRENCY_CODES: readonly string[] = Object.keys(TRAVEL_CURRENCIES);

/**
 * Every currency 6pm has a row for (`money/currency.ts`) except the đồng, which every rate is
 * quoted in: the server's ingest asks for these, travel currencies first. A home can be any of
 * them, and a trip can be to any of them.
 */
export const FX_CURRENCY_CODES: readonly string[] = [
  ...TRAVEL_CURRENCY_CODES,
  ...(
    'CHF CAD NZD MMK INR PKR LKR NPR BDT AED SAR QAR KWD BHD OMR JOD ILS TRY EGP MAD TND ZAR ' +
    'NGN KES GHS MXN BRL ARS CLP COP PEN UYU SEK NOK DKK ISK PLN CZK HUF RON BGN RSD UAH RUB ' +
    'KZT UZS GEL IRR IQD'
  ).split(' '),
];

const PRICED = new Set(FX_CURRENCY_CODES);

/** The national QR schemes Scan recognises, by the currency their codes are paid in. */
const SCHEME_CURRENCY: Readonly<Record<ForeignScheme, string>> = {
  promptpay: 'THB',
  paynow: 'SGD',
  duitnow: 'MYR',
  khqr: 'KHR',
};

/** Symbols shared by several currencies, written the way travellers tell them apart. */
const DISTINCT_SYMBOL: Readonly<Record<string, string>> = { CAD: 'CA$', NZD: 'NZ$', MXN: 'MX$' };
const SHARED_SYMBOLS = new Set(['$', 'kr', 'Rs', '¥']);

const built = new Map<string, TravelCurrency>();

/** A currency in the travel table; null for any other (a caller then writes its code). */
export function travelCurrency(code: string): TravelCurrency | null {
  return TRAVEL_CURRENCIES[code.toUpperCase()] ?? null;
}

/**
 * Any currency as Travel mode shows and converts it: the travel table's, else built from the
 * currency table (a symbol several currencies share becomes "CA$" or the code; whole units when
 * the currency has no minor unit in use, two decimals otherwise). Null only for a string that is
 * not a currency code.
 */
export function travelCurrencyOf(code: string): TravelCurrency | null {
  const upper = code.trim().toUpperCase();
  const known = TRAVEL_CURRENCIES[upper];
  if (known) return known;
  if (!/^[A-Z]{3}$/.test(upper)) return null;
  const kept = built.get(upper);
  if (kept) return kept;
  const row = currencyOf(upper);
  const symbol = SHARED_SYMBOLS.has(row.symbol) ? (DISTINCT_SYMBOL[upper] ?? upper) : row.symbol;
  const numeric = upper === 'VND' ? '704' : '';
  const made = currency(upper, symbol, row.minorDigits === 0 ? 0 : 2, numeric);
  built.set(upper, made);
  return made;
}

/**
 * Decimals a foreign amount in `code` is written and entered with: the one rule every screen,
 * card and parser reads. Whole units for đồng and the currencies with no minor unit in use, two
 * otherwise (three-decimal dinars are entered to two).
 */
export function foreignDecimalsOf(code: string): 0 | 2 {
  return travelCurrencyOf(code)?.decimals ?? 2;
}

/** Whether 6pm can price `code`: the đồng, or a currency the server fetches a rate for. */
export function hasRate(code: string): boolean {
  const upper = code.trim().toUpperCase();
  return upper === 'VND' || PRICED.has(upper);
}

/**
 * A trip's currency as it is written beside home's: its own symbol, or its code when home writes
 * the same symbol (a Canadian in New York sees "USD", not a second "$").
 */
export function tripCurrencyOf(code: string, home: Currency): TravelCurrency | null {
  const found = travelCurrencyOf(code);
  if (found === null || found.symbol !== home.symbol) return found;
  return { ...found, symbol: found.code };
}

/**
 * The currency of a place, or null at home (where the place spends the home currency, as Vietnam
 * does for a Vietnamese phone) and for places 6pm has no currency for.
 */
export function currencyOfCountry(country: string, home: Currency = VND): TravelCurrency | null {
  const code = COUNTRY_CURRENCY[country.toUpperCase()];
  return code === undefined || code === home.code ? null : tripCurrencyOf(code, home);
}

/** The currency of an EMV QR's tag 53 ("764" → THB). */
export function currencyOfNumeric(numeric: string): TravelCurrency | null {
  return Object.values(TRAVEL_CURRENCIES).find((c) => c.numeric === numeric) ?? null;
}

/** The currency a foreign QR is paid in: its tag 53 if it has one, else its scheme's or country's. */
export function currencyOfForeignQr(qr: {
  readonly currency?: string | undefined;
  readonly scheme?: ForeignScheme | undefined;
  readonly country?: string | undefined;
}): TravelCurrency | null {
  if (qr.currency !== undefined) {
    const byNumeric = currencyOfNumeric(qr.currency);
    if (byNumeric !== null) return byNumeric;
  }
  if (qr.scheme !== undefined) return travelCurrency(SCHEME_CURRENCY[qr.scheme]);
  return qr.country === undefined ? null : currencyOfCountry(qr.country);
}
