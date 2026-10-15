import { z } from 'zod';

import {
  currencyOfCountry,
  fxRatesResponseSchema,
  homeFxRate,
  isFxStale,
  VND,
  type Currency,
  type FxRate,
  type FxRatesResponse,
  type TravelCurrency,
} from '@6pm/domain';

/**
 * Travel mode's state, kept in the settings table under keys no backup carries: the switch, the
 * last place the phone was seen in, and the last good set of rates (so a trip works offline).
 */
export const TRAVEL_ON_KEY = 'travel.on';
export const TRAVEL_PLACE_KEY = 'travel.place';
export const FX_CACHE_KEY = 'fx.rates';

/** Rates are asked for again once the kept set is this old. The server fetches four times a day. */
export const FX_REFRESH_MS = 6 * 60 * 60 * 1000;

/** Where the phone was last seen: a country, and the city to call it by. */
export interface Place {
  /** ISO 3166-1 alpha-2, upper case. */
  readonly country: string;
  /** "Bangkok"; the country's name when the city is unknown. */
  readonly name: string;
  /** When it was seen (ISO). */
  readonly at: string;
}

export interface FxCache {
  /** When the phone got this set (ISO). */
  readonly fetchedAt: string;
  readonly rates: FxRatesResponse;
}

const placeSchema = z.object({
  country: z.string().regex(/^[A-Z]{2}$/),
  name: z.string().min(1),
  at: z.string(),
});
const fxCacheSchema = z.object({ fetchedAt: z.string(), rates: fxRatesResponseSchema });

function parseJson<T>(raw: string | null | undefined, schema: z.ZodType<T>): T | null {
  if (raw === null || raw === undefined) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const parsePlace = (raw: string | null | undefined): Place | null =>
  parseJson(raw, placeSchema);
export const parseFxCache = (raw: string | null | undefined): FxCache | null =>
  parseJson(raw, fxCacheSchema);

/**
 * A trip under way: Travel mode is on, Max is active and the phone is somewhere 6pm knows whose
 * currency is not home's (a Vietnamese phone in Bangkok; an American one in Hanoi).
 */
export interface Trip {
  /** What a Live Activity follows: a new country is a new trip. */
  readonly key: string;
  readonly place: Place;
  readonly currency: TravelCurrency;
  /** The currency's rate in home units (đồng for a đồng home), or null without one. */
  readonly rate: FxRate | null;
  /** The rate is older than the staleness threshold (or missing). */
  readonly stale: boolean;
}

/**
 * A currency's rate in home units from the kept set (the đồng quote itself when home is đồng),
 * dated by the older of the two quotes it is made of. Null for home itself and without a quote.
 */
export function rateFor(
  cache: FxCache | null,
  currency: string,
  home: Currency = VND,
): FxRate | null {
  return cache === null ? null : homeFxRate(cache.rates.rates, currency, home);
}

/** The đồng for one unit of a currency in the kept set ("1" for the đồng), or null. */
export function dongQuoteOf(cache: FxCache | null, currency: string): string | null {
  if (currency === 'VND') return '1';
  return cache?.rates.rates.find((r) => r.currency === currency)?.rate ?? null;
}

export function tripOf(input: {
  readonly on: boolean;
  readonly max: boolean;
  readonly place: Place | null;
  readonly cache: FxCache | null;
  readonly now: Date;
  /** Default đồng. */
  readonly home?: Currency;
}): Trip | null {
  const { on, max, place, cache, now, home = VND } = input;
  if (!on || !max || place === null) return null;
  const currency = currencyOfCountry(place.country, home);
  if (currency === null) return null;
  const rate = rateFor(cache, currency.code, home);
  return {
    key: `trip-${place.country}`,
    place,
    currency,
    rate,
    stale: rate === null || isFxStale(rate.asOf, now),
  };
}

/**
 * A set worth keeping replaces the kept one: an empty answer (the server has none yet) never
 * throws away rates the phone already has.
 */
export function nextFxCache(
  kept: FxCache | null,
  answer: FxRatesResponse,
  now: Date,
): FxCache | null {
  if (answer.rates.length === 0) return kept;
  return { fetchedAt: now.toISOString(), rates: answer };
}

export function shouldRefreshRates(cache: FxCache | null, now: Date): boolean {
  if (cache === null) return true;
  const at = Date.parse(cache.fetchedAt);
  return Number.isNaN(at) || now.getTime() - at >= FX_REFRESH_MS;
}
