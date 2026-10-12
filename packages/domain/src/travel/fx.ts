import { groupDigits, type Vnd } from '../money/format';
import type { TravelCurrency } from './currencies';

/**
 * Foreign money in đồng. Rates travel as exact decimal strings ("770.17" đồng for one baht) and
 * amounts as the decimal the user typed or the QR carried ("12.5"), so the maths is done on whole
 * numbers (BigInt) and rounded exactly once, at the end.
 *
 * Rounding: to the nearest đồng, halves away from zero. A foreign amount shown in its own
 * currency is rounded the same way to its decimals, except what is *left* of a day, which is
 * rounded down so the promise is always kept (as `floorToThousand` does for đồng).
 */

/** A rate or an amount as an exact decimal string: digits, optionally a point and more digits. */
export const DECIMAL_PATTERN = /^\d{1,15}(?:\.\d{1,15})?$/;

interface Fraction {
  readonly num: bigint;
  readonly den: bigint;
}

function fractionOf(decimal: string): Fraction | null {
  if (!DECIMAL_PATTERN.test(decimal)) return null;
  const [whole = '0', fraction = ''] = decimal.split('.');
  return { num: BigInt(whole + fraction), den: 10n ** BigInt(fraction.length) };
}

/** num / den rounded to the nearest integer, halves away from zero. `den` is positive. */
function roundHalfAway(num: bigint, den: bigint): bigint {
  const negative = num < 0n;
  const abs = negative ? -num : num;
  const rounded = (abs * 2n + den) / (den * 2n);
  return negative ? -rounded : rounded;
}

/** num / den rounded toward negative infinity. `den` is positive. */
function floorDiv(num: bigint, den: bigint): bigint {
  const q = num / den;
  return num % den !== 0n && num < 0n ? q - 1n : q;
}

/** A usable rate: an exact decimal greater than zero. */
export function isRate(rate: string): boolean {
  const f = fractionOf(rate);
  return f !== null && f.num > 0n;
}

/** The rate as a JS number, for the spend row that records which rate priced it. */
export function rateNumber(rate: string): number {
  return Number(rate);
}

/**
 * A foreign amount in đồng at `rate` (đồng for one unit), to the nearest đồng. Null when either
 * string is not an exact decimal, or the rate is zero.
 */
export function foreignToVnd(amount: string, rate: string): Vnd | null {
  const a = fractionOf(amount);
  const r = fractionOf(rate);
  if (a === null || r === null || r.num === 0n) return null;
  return Number(roundHalfAway(a.num * r.num, a.den * r.den));
}

/**
 * Đồng in a foreign currency, as that currency's minor units (cents for baht, yen for yen).
 * `round` (halves away from zero) for an amount spent, `floor` for what is left.
 */
export function vndToForeignMinor(
  vnd: Vnd,
  currency: Pick<TravelCurrency, 'decimals'>,
  rate: string,
  mode: 'round' | 'floor' = 'round',
): number | null {
  const r = fractionOf(rate);
  if (r === null || r.num === 0n || !Number.isSafeInteger(vnd)) return null;
  const scale = 10n ** BigInt(currency.decimals);
  const num = BigInt(vnd) * r.den * scale;
  return Number(mode === 'floor' ? floorDiv(num, r.num) : roundHalfAway(num, r.num));
}

/** Đồng in whole foreign units (baht, not satang): the Live Activity's and the pill's figures. */
export function vndToForeignWhole(
  vnd: Vnd,
  rate: string,
  mode: 'round' | 'floor' = 'round',
): number | null {
  return vndToForeignMinor(vnd, { decimals: 0 }, rate, mode);
}

/**
 * "฿1.200", "S$12,50", "−฿80": the symbol, digits grouped with dots as đồng are, and a comma
 * before the decimals when there are any. `minor` is in the currency's minor units.
 */
export function formatForeign(minor: number, currency: TravelCurrency): string {
  const sign = minor < 0 ? '−' : '';
  const abs = Math.abs(Math.round(minor));
  if (currency.decimals === 0) return `${sign}${currency.symbol}${groupDigits(abs)}`;
  const scale = 10 ** currency.decimals;
  const whole = Math.floor(abs / scale);
  const cents = abs % scale;
  const tail = cents === 0 ? '' : ',' + String(cents).padStart(currency.decimals, '0');
  return `${sign}${currency.symbol}${groupDigits(whole)}${tail}`;
}

/** Whole units in a currency: "฿640". */
export function formatForeignWhole(whole: number, currency: TravelCurrency): string {
  return formatForeign(whole * 10 ** currency.decimals, currency);
}

/**
 * What the keypad shows while it is typed: "฿12,5" for "12.5", "฿" alone for nothing yet. The
 * typed decimals are kept as they are, so "12." reads "฿12,".
 */
export function formatTypedForeign(digits: string, currency: TravelCurrency): string {
  const [whole = '', fraction] = digits.split('.');
  const grouped = whole === '' ? '0' : groupDigits(Number(whole));
  return `${currency.symbol}${grouped}${fraction === undefined ? '' : ',' + fraction}`;
}
