import type { ForeignAmount, Waiting } from '../capture/foreign-price';
import type { Currency, Money } from '../money/currency';
import { travelCurrencyOf } from './currencies';
import { DECIMAL_PATTERN, isRate, rateNumber } from './fx';

/**
 * Foreign money in the home currency. The server quotes every currency in đồng ("770.17" đồng for
 * one baht), so a rate in any home currency is two of those quotes divided: baht in dollars is
 * đồng per baht over đồng per dollar. Amounts stay exact decimal strings and the maths stays on
 * whole numbers (BigInt), rounded once at the end, halves away from zero; what is *left* of a day
 * is rounded down so the promise is always kept.
 */

interface Fraction {
  readonly num: bigint;
  readonly den: bigint;
}

function fractionOf(decimal: string): Fraction | null {
  if (!DECIMAL_PATTERN.test(decimal)) return null;
  const [whole = '0', fraction = ''] = decimal.split('.');
  return { num: BigInt(whole + fraction), den: 10n ** BigInt(fraction.length) };
}

function roundHalfAway(num: bigint, den: bigint): bigint {
  const negative = num < 0n;
  const abs = negative ? -num : num;
  const rounded = (abs * 2n + den) / (den * 2n);
  return negative ? -rounded : rounded;
}

function floorDiv(num: bigint, den: bigint): bigint {
  const q = num / den;
  return num % den !== 0n && num < 0n ? q - 1n : q;
}

/** Decimals a cross rate keeps: far finer than any price is written in. */
const CROSS_DECIMALS = 12n;

/**
 * Home units for one unit of a currency, from the two đồng quotes: `code`'s and home's. Đồng is
 * its own quote ("1"), and a currency in itself is "1". Null when either quote is missing or not a
 * usable rate. The result is an exact decimal string: the quote itself when home is đồng, else cut
 * (not rounded) at twelve decimals.
 */
export function homeRate(
  code: string,
  home: Currency,
  dongPerUnit: (code: string) => string | null,
): string | null {
  if (code === home.code) return '1';
  const quote = code === 'VND' ? '1' : dongPerUnit(code);
  const homeQuote = home.code === 'VND' ? '1' : dongPerUnit(home.code);
  if (quote === null || homeQuote === null) return null;
  // A đồng home keeps the server's quote digit for digit.
  if (home.code === 'VND') return isRate(quote) ? quote : null;
  const q = fractionOf(quote);
  const h = fractionOf(homeQuote);
  if (q === null || h === null || q.num === 0n || h.num === 0n) return null;
  const scaled = (q.num * h.den * 10n ** CROSS_DECIMALS) / (q.den * h.num);
  if (scaled === 0n) return null;
  const digits = scaled.toString().padStart(Number(CROSS_DECIMALS) + 1, '0');
  const whole = digits.slice(0, -Number(CROSS_DECIMALS));
  const fraction = digits.slice(-Number(CROSS_DECIMALS)).replace(/0+$/, '');
  const text = fraction === '' ? whole : `${whole}.${fraction}`;
  return DECIMAL_PATTERN.test(text) ? text : null;
}

/**
 * A foreign amount ("12.5") at `rate` (home units for one unit), in minor units of home, to the
 * nearest one. Null when either string is not an exact decimal, or the rate is zero.
 */
export function foreignToHome(amount: string, rate: string, home: Currency): Money | null {
  const a = fractionOf(amount);
  const r = fractionOf(rate);
  if (a === null || r === null || r.num === 0n) return null;
  const minor = BigInt(home.minorPerMajor);
  return Number(roundHalfAway(a.num * r.num * minor, a.den * r.den));
}

/**
 * Home money (minor units) in a foreign currency's minor units at `rate` (home units for one
 * unit). `round` for an amount spent, `floor` for what is left.
 */
export function homeToForeignMinor(
  amount: Money,
  home: Currency,
  foreignDecimals: number,
  rate: string,
  mode: 'round' | 'floor' = 'round',
): number | null {
  const r = fractionOf(rate);
  if (r === null || r.num === 0n || !Number.isSafeInteger(amount)) return null;
  const num = BigInt(amount) * r.den * 10n ** BigInt(foreignDecimals);
  const den = r.num * BigInt(home.minorPerMajor);
  return Number(mode === 'floor' ? floorDiv(num, den) : roundHalfAway(num, den));
}

/** A rate as the server answers it: đồng for one unit of `currency`, and the day it is for. */
export interface QuotedRate {
  readonly currency: string;
  readonly rate: string;
  readonly asOf: string;
  readonly source: string;
}

/**
 * A currency's rate in home units, from a set of đồng quotes (the server's answer, or the set the
 * phone kept). When home is đồng it is the quote itself, unchanged. Otherwise it is the two quotes
 * divided, dated by the older of the two, so a stale home quote makes the rate stale too. Null
 * for home itself (nothing to convert) and when either quote is missing.
 */
export function homeFxRate(
  rates: readonly QuotedRate[],
  code: string,
  home: Currency,
): QuotedRate | null {
  const quoteOf = (c: string) => rates.find((r) => r.currency === c) ?? null;
  if (code === home.code) return null;
  if (home.code === 'VND') return quoteOf(code);
  const homeQuote = quoteOf(home.code);
  const own = code === 'VND' ? null : quoteOf(code);
  if (homeQuote === null || (code !== 'VND' && own === null)) return null;
  const rate = homeRate(code, home, (c) => quoteOf(c)?.rate ?? null);
  if (rate === null) return null;
  const asOf = own !== null && own.asOf < homeQuote.asOf ? own.asOf : homeQuote.asOf;
  return { currency: code, rate, asOf, source: own?.source ?? homeQuote.source };
}

/**
 * A waiting foreign amount priced at `rate` (home units for one unit): the home amount to the
 * nearest minor unit, and the foreign amount carrying the rate that priced it. When home is đồng
 * this is `priceWaiting`. Null for a rate that is not one, or an amount that prices to nothing.
 */
export function priceWaitingInHome(
  waiting: Pick<Waiting, 'currency' | 'amount'>,
  rate: string,
  home: Currency,
): { amount: Money; foreignAmount: ForeignAmount } | null {
  if (!isRate(rate)) return null;
  const decimals = travelCurrencyOf(waiting.currency)?.decimals ?? 2;
  const amount = foreignToHome(waiting.amount.toFixed(decimals), rate, home);
  if (amount === null || amount <= 0) return null;
  return {
    amount,
    foreignAmount: { currency: waiting.currency, amount: waiting.amount, rate: rateNumber(rate) },
  };
}
