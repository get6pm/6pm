import type { ForeignScheme } from '../vietqr/foreign-scheme';

/** A currency Travel mode can show and convert. */
export interface TravelCurrency {
  /** ISO 4217 alphabetic code: "THB". */
  readonly code: string;
  /** What a person writes in front of the amount: "฿". */
  readonly symbol: string;
  /**
   * Decimals as prices are written there. Cambodia, Indonesia and Laos have official cents nobody
   * uses, so they are entered and shown in whole units, like đồng.
   */
  readonly decimals: 0 | 2;
  /** ISO 4217 numeric code, as an EMV QR carries it in tag 53: "764". */
  readonly numeric: string;
}

const currency = (code: string, symbol: string, decimals: 0 | 2, numeric: string) =>
  ({ code, symbol, decimals, numeric }) satisfies TravelCurrency;

/** Every currency 6pm fetches a rate for. The server's daily ingest asks for exactly these. */
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
  TWD: currency('TWD', 'NT$', 2, '901'),
  HKD: currency('HKD', 'HK$', 2, '344'),
  USD: currency('USD', '$', 2, '840'),
  AUD: currency('AUD', 'A$', 2, '036'),
  EUR: currency('EUR', '€', 2, '978'),
  GBP: currency('GBP', '£', 2, '826'),
};

export const TRAVEL_CURRENCY_CODES: readonly string[] = Object.keys(TRAVEL_CURRENCIES);

const EURO_COUNTRIES = ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'NL', 'PT'];

/** ISO 3166-1 alpha-2 country → the currency spent there. Vietnam is home, so it is absent. */
export const COUNTRY_CURRENCY: Readonly<Record<string, string>> = {
  TH: 'THB',
  SG: 'SGD',
  MY: 'MYR',
  KH: 'KHR',
  LA: 'LAK',
  ID: 'IDR',
  PH: 'PHP',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  TW: 'TWD',
  HK: 'HKD',
  US: 'USD',
  AU: 'AUD',
  GB: 'GBP',
  ...Object.fromEntries(EURO_COUNTRIES.map((country) => [country, 'EUR'])),
};

/** The national QR schemes Scan recognises, by the currency their codes are paid in. */
const SCHEME_CURRENCY: Readonly<Record<ForeignScheme, string>> = {
  promptpay: 'THB',
  paynow: 'SGD',
  duitnow: 'MYR',
  khqr: 'KHR',
};

export function travelCurrency(code: string): TravelCurrency | null {
  return TRAVEL_CURRENCIES[code.toUpperCase()] ?? null;
}

/** The currency of a country abroad, or null for Vietnam and for places 6pm has no rate for. */
export function currencyOfCountry(country: string): TravelCurrency | null {
  const code = COUNTRY_CURRENCY[country.toUpperCase()];
  return code === undefined ? null : travelCurrency(code);
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
