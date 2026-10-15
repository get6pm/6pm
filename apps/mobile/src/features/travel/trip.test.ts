import { describe, expect, it } from '@jest/globals';

import { currencyOf, type FxRatesResponse } from '@6pm/domain';

import {
  dongQuoteOf,
  nextFxCache,
  parseFxCache,
  parsePlace,
  rateFor,
  shouldRefreshRates,
  tripOf,
  type FxCache,
} from './trip';

const now = new Date('2026-10-12T05:00:00Z');
const answer: FxRatesResponse = {
  snapshotId: '7',
  asOf: '2026-10-12',
  stale: false,
  rates: [
    { currency: 'THB', rate: '770.17', asOf: '2026-10-12', source: 'frankfurter' },
    { currency: 'JPY', rate: '163.22', asOf: '2026-10-09', source: 'frankfurter' },
  ],
};
const cache: FxCache = { fetchedAt: now.toISOString(), rates: answer };
const bangkok = { country: 'TH', name: 'Bangkok', at: now.toISOString() };

describe('a trip', () => {
  it('is under way abroad with the switch on and Max active', () => {
    const trip = tripOf({ on: true, max: true, place: bangkok, cache, now });
    expect(trip).toMatchObject({ key: 'trip-TH', stale: false });
    expect(trip?.currency.code).toBe('THB');
    expect(trip?.rate?.rate).toBe('770.17');
  });

  it('is not at home, with the switch off, without Max, or somewhere with no rate', () => {
    const base = { on: true, max: true, place: bangkok, cache, now };
    expect(tripOf({ ...base, place: { ...bangkok, country: 'VN' } })).toBeNull();
    expect(tripOf({ ...base, on: false })).toBeNull();
    expect(tripOf({ ...base, max: false })).toBeNull();
    expect(tripOf({ ...base, place: null })).toBeNull();
    expect(tripOf({ ...base, place: { ...bangkok, country: 'ZZ' } })).toBeNull();
  });

  it('is stale on an old rate and without one', () => {
    const tokyo = { country: 'JP', name: 'Tokyo', at: now.toISOString() };
    expect(tripOf({ on: true, max: true, place: tokyo, cache, now })?.stale).toBe(true);
    const bare = tripOf({ on: true, max: true, place: bangkok, cache: null, now });
    expect(bare).toMatchObject({ rate: null, stale: true });
  });
});

describe('a trip from a home that is not đồng', () => {
  const usd = currencyOf('USD');
  const withDollar: FxCache = {
    ...cache,
    rates: {
      ...answer,
      rates: [
        ...answer.rates,
        { currency: 'USD', rate: '26000', asOf: '2026-10-12', source: 'frankfurter' },
      ],
    },
  };
  const hanoi = { country: 'VN', name: 'Hanoi', at: now.toISOString() };

  it('is in Vietnam, in đồng, at home units for one đồng', () => {
    const trip = tripOf({ on: true, max: true, place: hanoi, cache: withDollar, now, home: usd });
    expect(trip?.currency).toMatchObject({ code: 'VND', symbol: '₫', decimals: 0 });
    expect(trip?.rate?.rate).toBe('0.000038461538');
    expect(trip?.stale).toBe(false);
  });

  it('is not at home, and has no rate without home’s own quote', () => {
    const newYork = { country: 'US', name: 'New York', at: now.toISOString() };
    const base = { on: true, max: true, cache: withDollar, now, home: usd };
    expect(tripOf({ ...base, place: newYork })).toBeNull();
    const bare = tripOf({ ...base, place: bangkok, cache });
    expect(bare).toMatchObject({ rate: null, stale: true });
    expect(tripOf({ ...base, place: bangkok })?.rate?.rate).toBe('0.029621923076');
  });

  it('converts through the kept đồng quotes, trip or not', () => {
    expect(rateFor(withDollar, 'THB')?.rate).toBe('770.17');
    expect(rateFor(withDollar, 'VND', usd)?.rate).toBe('0.000038461538');
    expect(rateFor(withDollar, 'USD', usd)).toBeNull();
    expect(dongQuoteOf(withDollar, 'USD')).toBe('26000');
    expect(dongQuoteOf(withDollar, 'VND')).toBe('1');
    expect(dongQuoteOf(null, 'USD')).toBeNull();
  });
});

describe('the kept rates', () => {
  it('are replaced by a new set, but never by an empty one', () => {
    const later = new Date('2026-10-12T12:00:00Z');
    expect(nextFxCache(cache, { ...answer, snapshotId: '8' }, later)?.fetchedAt).toBe(
      later.toISOString(),
    );
    const empty: FxRatesResponse = { snapshotId: null, asOf: null, stale: true, rates: [] };
    expect(nextFxCache(cache, empty, later)).toBe(cache);
    expect(nextFxCache(null, empty, later)).toBeNull();
  });

  it('are asked for again after six hours, or when there are none', () => {
    expect(shouldRefreshRates(null, now)).toBe(true);
    expect(shouldRefreshRates(cache, new Date('2026-10-12T10:59:00Z'))).toBe(false);
    expect(shouldRefreshRates(cache, new Date('2026-10-12T11:00:00Z'))).toBe(true);
  });

  it('read back what was kept, and nothing from damaged text', () => {
    expect(parseFxCache(JSON.stringify(cache))).toEqual(cache);
    expect(parseFxCache('{"fetchedAt":1}')).toBeNull();
    expect(parseFxCache('not json')).toBeNull();
    expect(parsePlace(JSON.stringify(bangkok))).toEqual(bangkok);
    expect(parsePlace(null)).toBeNull();
  });
});
