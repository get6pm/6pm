import { describe, expect, it } from 'vitest';

import { currencyOf } from '../money/currency';
import {
  COUNTRY_CURRENCY,
  currencyOfCountry,
  currencyOfForeignQr,
  currencyOfNumeric,
  FX_CURRENCY_CODES,
} from './currencies';
import { isFxStale, tripDay } from './trip-day';

describe('the currency of a place', () => {
  it('knows the destinations and the foreign QR schemes', () => {
    for (const [country, code] of [
      ['TH', 'THB'],
      ['SG', 'SGD'],
      ['MY', 'MYR'],
      ['KH', 'KHR'],
      ['JP', 'JPY'],
      ['KR', 'KRW'],
      ['US', 'USD'],
      ['fr', 'EUR'],
    ] as const) {
      expect(currencyOfCountry(country)?.code).toBe(code);
    }
    expect(currencyOfForeignQr({ scheme: 'promptpay' })?.code).toBe('THB');
    expect(currencyOfForeignQr({ scheme: 'paynow' })?.code).toBe('SGD');
    expect(currencyOfForeignQr({ scheme: 'duitnow' })?.code).toBe('MYR');
    expect(currencyOfForeignQr({ scheme: 'khqr' })?.code).toBe('KHR');
  });

  it('reads a QR’s tag 53 before its scheme, and its country last', () => {
    expect(currencyOfNumeric('764')?.code).toBe('THB');
    expect(currencyOfForeignQr({ currency: '840', scheme: 'khqr' })?.code).toBe('USD');
    expect(currencyOfForeignQr({ country: 'JP' })?.code).toBe('JPY');
    expect(currencyOfForeignQr({ currency: '999' })).toBeNull();
  });

  it('prices schemes from further away, by numeric or alphabetic code', () => {
    expect(currencyOfNumeric('986')?.code).toBe('BRL');
    expect(currencyOfForeignQr({ scheme: 'pix' })?.code).toBe('BRL');
    expect(currencyOfForeignQr({ scheme: 'qris' })?.code).toBe('IDR');
    expect(currencyOfForeignQr({ currency: 'INR', scheme: 'upi' })?.code).toBe('INR');
    expect(currencyOfForeignQr({ currency: 'EUR', scheme: 'swissqr' })?.code).toBe('EUR');
  });

  it('has no currency for home, or for a place with no rate', () => {
    expect(currencyOfCountry('VN')).toBeNull();
    expect(currencyOfCountry('ZZ')).toBeNull();
  });

  it('maps every country to a currency it fetches a rate for', () => {
    for (const code of Object.values(COUNTRY_CURRENCY)) {
      expect([...FX_CURRENCY_CODES, 'VND']).toContain(code);
    }
  });
});

describe('rates going stale', () => {
  const at = (iso: string) => new Date(iso);

  it('is fresh within 48 hours of the rate’s date', () => {
    expect(isFxStale('2026-10-12', at('2026-10-12T09:00:00Z'))).toBe(false);
    expect(isFxStale('2026-10-10', at('2026-10-12T00:00:00Z'))).toBe(false);
  });

  it('is stale after 48 hours, and when the date cannot be read', () => {
    expect(isFxStale('2026-10-10', at('2026-10-12T00:00:01Z'))).toBe(true);
    expect(isFxStale('yesterday', at('2026-10-12T00:00:00Z'))).toBe(true);
    expect(isFxStale('2026-10-10', at('2026-10-12T05:00:00Z'), 72)).toBe(false);
  });
});

describe('a day abroad', () => {
  it('shows the line and the spend in the local currency', () => {
    // 924.000₫ line, 493.000₫ spent, at 770.17₫ a baht.
    const day = tripDay({ line: 924_000, spent: 493_000 }, '770.17');
    expect(day).toEqual({
      line: 1_199,
      spent: 640,
      left: 559,
      spentHome: 493_000,
      spentVnd: 493_000,
      fraction: 493_000 / 924_000,
    });
  });

  it('converts what is left from đồng, so it never promises more than the đồng do', () => {
    // At 3.000₫ a unit: line 4, spent 0 (a third, rounded), but only 11.000₫ = 3,67 units left.
    const day = tripDay({ line: 12_000, spent: 1_000 }, '3000');
    expect(day).toMatchObject({ line: 4, spent: 0, left: 3 });
    const tight = tripDay({ line: 1_000, spent: 1 }, '1000');
    expect(tight?.line).toBe(1);
    expect(tight?.left).toBe(0);
  });

  it('goes negative and fills the bar when the day went over', () => {
    const day = tripDay({ line: 100_000, spent: 150_000 }, '770.17');
    expect(day?.left).toBe(-65);
    expect(day?.fraction).toBe(1);
    expect(tripDay({ line: 0, spent: 0 }, '770.17')?.fraction).toBe(1);
  });

  it('counts a dollar home in whole baht', () => {
    // $35.54 line, $18.96 spent, at $0.029621923076 a baht.
    const day = tripDay({ line: 3_554, spent: 1_896 }, '0.029621923076', currencyOf('USD'));
    expect(day).toMatchObject({ line: 1_199, spent: 640, left: 559, spentHome: 1_896 });
  });

  it('has no day without a usable rate', () => {
    expect(tripDay({ line: 100_000, spent: 0 }, '0')).toBeNull();
  });
});
