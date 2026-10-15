/**
 * An amount of money: an integer in the home currency's minor unit (cents for USD, đồng for VND,
 * which has none smaller, yen for JPY).
 */
export type Money = number;

export interface Currency {
  /** ISO 4217, upper case: "VND", "USD". */
  readonly code: string;
  /** Decimals in daily use: 0 for VND, JPY, IDR; 2 for USD; 3 for KWD. */
  readonly minorDigits: number;
  /** Minor units in one major unit: 1, 100 or 1000. */
  readonly minorPerMajor: number;
  /** The symbol people write: "₫", "$", "€", "Rp". The code when there is none in common use. */
  readonly symbol: string;
  /**
   * The amount that plays the part 1.000₫ plays in the design, in minor units: daily lines floor
   * to it, the keypad's k and the short form count in it. Never less than one major unit.
   */
  readonly step: Money;
  /** About how many major units one US dollar buys; only for scaling the design's own amounts. */
  readonly perUsd: number;
}

/** [minor digits, symbol, about how many per US dollar]. Rough values: never used to convert. */
/** Symbols are left-to-right: a right-to-left one would reorder the words around an amount. */
type Row = readonly [number, string, number];

const ROWS: Readonly<Record<string, Row>> = {
  VND: [0, '₫', 26_000],
  USD: [2, '$', 1],
  EUR: [2, '€', 0.9],
  GBP: [2, '£', 0.78],
  CHF: [2, 'CHF', 0.85],
  CAD: [2, '$', 1.38],
  AUD: [2, '$', 1.52],
  NZD: [2, '$', 1.66],
  SGD: [2, '$', 1.3],
  HKD: [2, '$', 7.8],
  CNY: [2, '¥', 7.2],
  TWD: [0, '$', 32],
  JPY: [0, '¥', 150],
  KRW: [0, '₩', 1_400],
  THB: [2, '฿', 33],
  MYR: [2, 'RM', 4.4],
  IDR: [0, 'Rp', 16_000],
  PHP: [2, '₱', 57],
  KHR: [0, '៛', 4_100],
  LAK: [0, '₭', 21_500],
  MMK: [0, 'K', 2_100],
  INR: [2, '₹', 85],
  PKR: [0, 'Rs', 280],
  LKR: [2, 'Rs', 300],
  NPR: [2, 'Rs', 136],
  BDT: [2, '৳', 120],
  AED: [2, 'AED', 3.67],
  SAR: [2, 'SAR', 3.75],
  QAR: [2, 'QAR', 3.64],
  KWD: [3, 'KD', 0.31],
  BHD: [3, 'BD', 0.38],
  OMR: [3, 'OMR', 0.38],
  JOD: [3, 'JD', 0.71],
  ILS: [2, '₪', 3.7],
  TRY: [2, '₺', 41],
  EGP: [2, 'E£', 49],
  MAD: [2, 'MAD', 9.3],
  TND: [3, 'DT', 3],
  ZAR: [2, 'R', 18],
  NGN: [2, '₦', 1_550],
  KES: [2, 'KSh', 129],
  GHS: [2, 'GH₵', 12],
  MXN: [2, '$', 18.5],
  BRL: [2, 'R$', 5.5],
  ARS: [2, '$', 1_300],
  CLP: [0, '$', 950],
  COP: [0, '$', 4_000],
  PEN: [2, 'S/', 3.7],
  UYU: [2, '$', 40],
  SEK: [2, 'kr', 10],
  NOK: [2, 'kr', 10.5],
  DKK: [2, 'kr', 6.7],
  ISK: [0, 'kr', 137],
  PLN: [2, 'zł', 3.8],
  CZK: [2, 'Kč', 22.5],
  HUF: [0, 'Ft', 360],
  RON: [2, 'lei', 4.5],
  BGN: [2, 'лв', 1.75],
  RSD: [0, 'RSD', 105],
  UAH: [2, '₴', 41],
  RUB: [2, '₽', 90],
  KZT: [0, '₸', 500],
  UZS: [0, 'soʻm', 12_700],
  GEL: [2, '₾', 2.7],
  // Written with its code: the rial sign is right-to-left and reorders the sentence around it.
  IRR: [0, 'IRR', 42_000],
  IQD: [0, 'IQD', 1_310],
};

/** A code 6pm has no row for: two decimals, its code as the symbol, a dollar's worth. */
const unknownRow = (code: string): Row => [2, code, 1];

/** Daily lines in the design round to 1.000₫, about four US cents. */
const DESIGN_STEP_IN_USD = 1000 / 26_000;

function build(code: string, [minorDigits, symbol, perUsd]: Row): Currency {
  const minorPerMajor = 10 ** minorDigits;
  // The design's step in this currency, rounded to a power of ten, and never below one major unit.
  const stepMajor = Math.max(1, 10 ** Math.round(Math.log10(perUsd * DESIGN_STEP_IN_USD)));
  return { code, minorDigits, minorPerMajor, symbol, step: stepMajor * minorPerMajor, perUsd };
}

export const VND: Currency = build('VND', ROWS.VND ?? [0, '₫', 26_000]);

const cache = new Map<string, Currency>([['VND', VND]]);

/** The currency for an ISO 4217 code, in any case. An unknown code still gets a usable currency. */
export function currencyOf(code: string): Currency {
  const upper = code.trim().toUpperCase();
  const known = cache.get(upper);
  if (known) return known;
  const row = ROWS[upper];
  const currency = build(upper, row ?? unknownRow(upper));
  cache.set(upper, currency);
  return currency;
}

/** Whether 6pm has a symbol and rough value for the code (any 3-letter code is still usable). */
export function isKnownCurrency(code: string): boolean {
  return code.trim().toUpperCase() in ROWS;
}

/** Whole major units in minor units: `toMinor(3.5, USD)` is 350. */
export function toMinor(major: number, currency: Currency): Money {
  return Math.round(major * currency.minorPerMajor);
}

/** Minor units as a major amount: `toMajor(350, USD)` is 3.5. */
export function toMajor(amount: Money, currency: Currency): number {
  return amount / currency.minorPerMajor;
}

/** Counted in steps, as the design counts in thousands: `steps(5, VND)` is 5.000₫, `(5, USD)` $5. */
export function steps(count: number, currency: Currency): Money {
  return Math.round(count * currency.step);
}

/** Floors to a whole step, as every daily line does (1.000₫ in Vietnam, $1 in the US). */
export function floorToStep(amount: Money, currency: Currency): Money {
  return Math.floor(amount / currency.step) * currency.step;
}

/** Rounds to the nearest step. */
export function roundToStep(amount: Money, currency: Currency): Money {
  return Math.round(amount / currency.step) * currency.step;
}

/** Ceils to fifty steps, as pot set-asides do (50.000₫ in Vietnam, $50 in the US). */
export function ceilToSetAside(amount: Money, currency: Currency): Money {
  const unit = 50 * currency.step;
  return Math.ceil(amount / unit) * unit;
}

/** The round numbers (times a power of ten) a scaled amount snaps to. */
const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] as const;

/**
 * An amount the design names in đồng, worth about the same in `currency`, snapped to a round
 * number of at least one step: a chart's scale, a "big spend" threshold, a starting goal.
 * VND amounts come back as they are.
 */
export function designAmount(dong: number, currency: Currency): Money {
  if (currency.code === 'VND') return dong;
  const major = (dong / VND.perUsd) * currency.perUsd;
  if (major <= 0) return 0;
  const power = 10 ** Math.floor(Math.log10(major));
  const distance = (n: number) => Math.abs(Math.log(n * power) - Math.log(major));
  const nice = NICE.reduce((best, n) => (distance(n) < distance(best) ? n : best));
  return Math.max(currency.step, toMinor(nice * power, currency));
}
