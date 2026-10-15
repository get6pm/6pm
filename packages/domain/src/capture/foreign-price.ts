import { VND, type Currency, type Money } from '../money/currency';
import { localDateOf, type LocalDate } from '../time/local-date';
import { TRAVEL_CURRENCIES, travelCurrency } from '../travel/currencies';
import { formatForeign, isRate, rateNumber } from '../travel/fx';
import { foreignToHome } from '../travel/home-fx';

/**
 * Pricing a captured foreign amount later. A shared receipt in another currency is saved even
 * when the phone has no rate for it: its home amount is 0 and its foreign amount carries a rate of 0,
 * "rate pending", until the app finds the rate of the day it was paid and prices it. Receipts
 * saved before that was kept left the printed amount in the note ("Rp496.650"), which is read
 * back here so they are priced too.
 */

/** The rate a waiting foreign amount carries until it is priced. */
export const RATE_PENDING = 0;

/** A foreign amount as a spend row keeps it: its own units, and home units for one unit. */
export interface ForeignAmount {
  readonly currency: string;
  readonly amount: number;
  readonly rate: number;
}

/** The parts of a saved spend that say whether it is waiting for a rate. */
export interface WaitingSpend {
  readonly amount: number;
  readonly source: string;
  readonly note: string | null;
  readonly foreignAmount: ForeignAmount | null;
}

/** A foreign amount still to be priced, and where it came from. */
export interface Waiting {
  readonly currency: string;
  readonly amount: number;
  /** The note held the printed amount, from before the foreign amount was kept. */
  readonly fromNote: boolean;
}

/** Symbols longest first, so "S$68,80" is never read as "$". */
const BY_SYMBOL = Object.values(TRAVEL_CURRENCIES).sort(
  (a, b) => b.symbol.length - a.symbol.length,
);

/**
 * A note that is exactly a foreign amount as the share card printed it ("Rp496.650", "S$68,80"),
 * read back; null for any other note. Only an exact round trip counts, so a note someone typed
 * is never taken for an amount.
 */
export function readForeignNote(note: string | null): { currency: string; amount: number } | null {
  const text = note?.trim() ?? '';
  const currency = BY_SYMBOL.find((c) => text.startsWith(c.symbol));
  if (!currency) return null;
  const digits = text.slice(currency.symbol.length);
  const pattern =
    currency.decimals === 0 ? /^\d{1,3}(?:\.\d{3})*$/ : /^\d{1,3}(?:\.\d{3})*(?:,\d{2})?$/;
  if (!pattern.test(digits)) return null;
  const [whole = '', cents = ''] = digits.split(',');
  const minor = Number(whole.replace(/\./g, '') + cents.padEnd(currency.decimals, '0'));
  if (!Number.isSafeInteger(minor) || minor <= 0) return null;
  if (formatForeign(minor, currency) !== text) return null;
  return { currency: currency.code, amount: minor / 10 ** currency.decimals };
}

/**
 * The foreign amount a spend is waiting to have priced: one saved with a pending rate, or a
 * shared receipt saved at 0₫ whose note is its printed foreign amount. Null for anything priced,
 * anything the person has given an amount, and anything 6pm has no rate for.
 */
export function waitingForeign(spend: WaitingSpend): Waiting | null {
  if (spend.amount > 0) return null;
  const foreign = spend.foreignAmount;
  if (foreign !== null) {
    if (foreign.rate > 0 || foreign.amount <= 0) return null;
    // Đồng waits too, on a phone counting another currency: the server quotes everything in it.
    if (!travelCurrency(foreign.currency) && foreign.currency !== 'VND') return null;
    return { currency: foreign.currency, amount: foreign.amount, fromNote: false };
  }
  if (spend.source !== 'shared') return null;
  const noted = readForeignNote(spend.note);
  return noted ? { ...noted, fromNote: true } : null;
}

/** The day whose rate prices a receipt: the phone's calendar day it was paid. */
export function rateDayOf(at: Date): LocalDate {
  return localDateOf(at);
}

/**
 * A waiting foreign amount priced at `rate` (đồng for one unit), for a phone counting đồng;
 * `priceWaitingInHome` prices one in any home. Null for a rate that is not one.
 */
export function priceWaiting(
  waiting: Waiting,
  rate: string,
): { amount: Money; foreignAmount: ForeignAmount } | null {
  if (!isRate(rate)) return null;
  const decimals = travelCurrency(waiting.currency)?.decimals ?? 2;
  const amount = foreignToHome(waiting.amount.toFixed(decimals), rate, VND);
  if (amount === null || amount <= 0) return null;
  return {
    amount,
    foreignAmount: { currency: waiting.currency, amount: waiting.amount, rate: rateNumber(rate) },
  };
}

/**
 * A home amount typed by hand for a foreign spend still waiting for its rate settles it: the rate
 * becomes the one the person paid at (home units over the foreign amount), so it no longer waits
 * and a later pricing pass never overwrites what they typed. Anything else is left as it is.
 */
export function settleTypedAmount(
  foreign: ForeignAmount | null,
  typed: { readonly amount?: Money; readonly foreignAmount?: ForeignAmount | null },
  home: Currency = VND,
): ForeignAmount | null | undefined {
  if (typed.foreignAmount !== undefined || typed.amount === undefined) return undefined;
  if (foreign === null || foreign.rate > RATE_PENDING || !(foreign.amount > 0)) return undefined;
  if (!(typed.amount > 0)) return undefined;
  return { ...foreign, rate: typed.amount / home.minorPerMajor / foreign.amount };
}
