import { describe, expect, it } from 'vitest';

import { currencyOf, isKnownCurrency, VND } from '../money/currency';
import {
  currencyOfCountry,
  currencyOfForeignQr,
  FX_CURRENCY_CODES,
  travelCurrency,
  travelCurrencyOf,
  tripCurrencyOf,
} from './currencies';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

describe('the currencies with a rate', () => {
  it('are every currency 6pm has a row for, but the đồng they are quoted in', () => {
    const known: string[] = [];
    for (const a of LETTERS)
      for (const b of LETTERS)
        for (const c of LETTERS) if (isKnownCurrency(a + b + c)) known.push(a + b + c);
    expect([...FX_CURRENCY_CODES].sort()).toEqual(known.filter((code) => code !== 'VND').sort());
    expect(new Set(FX_CURRENCY_CODES).size).toBe(FX_CURRENCY_CODES.length);
  });
});

describe('any currency abroad', () => {
  it('keeps the travel table’s symbols, decimals and QR codes', () => {
    expect(travelCurrencyOf('sgd')).toEqual({
      code: 'SGD',
      symbol: 'S$',
      decimals: 2,
      numeric: '702',
    });
    expect(travelCurrencyOf('TWD')?.decimals).toBe(2);
  });

  it('builds the rest from the currency table, telling shared symbols apart', () => {
    expect(travelCurrencyOf('VND')).toEqual({
      code: 'VND',
      symbol: '₫',
      decimals: 0,
      numeric: '704',
    });
    expect(travelCurrencyOf('HUF')).toMatchObject({ symbol: 'Ft', decimals: 0, numeric: '' });
    expect(travelCurrencyOf('CAD')?.symbol).toBe('CA$');
    expect(travelCurrencyOf('SEK')?.symbol).toBe('SEK');
    expect(travelCurrencyOf('KWD')?.decimals).toBe(2);
    expect(travelCurrencyOf('nope')).toBeNull();
  });

  it('leaves the travel table lookup as it was', () => {
    expect(travelCurrency('CHF')).toBeNull();
    expect(travelCurrency('THB')?.symbol).toBe('฿');
  });

  it('writes the code when home writes the same symbol', () => {
    expect(tripCurrencyOf('USD', currencyOf('CAD'))?.symbol).toBe('USD');
    expect(tripCurrencyOf('USD', VND)?.symbol).toBe('$');
  });
});

describe('a place abroad, from home', () => {
  const usd = currencyOf('USD');

  it('is anywhere that spends another currency than home', () => {
    expect(currencyOfCountry('VN')).toBeNull();
    expect(currencyOfCountry('TH')?.code).toBe('THB');
    expect(currencyOfCountry('VN', usd)).toMatchObject({ code: 'VND', symbol: '₫', decimals: 0 });
    expect(currencyOfCountry('US', usd)).toBeNull();
    expect(currencyOfCountry('EC', usd)).toBeNull();
    expect(currencyOfCountry('CA', usd)?.symbol).toBe('CA$');
    expect(currencyOfCountry('BG')?.code).toBe('EUR');
  });

  it('still reads a foreign QR from a Vietnamese phone as before', () => {
    expect(currencyOfForeignQr({ country: 'JP' })?.code).toBe('JPY');
    expect(currencyOfForeignQr({ country: 'VN' })).toBeNull();
  });
});
