import { describe, expect, it } from 'vitest';

import { priceWaiting } from '../capture/foreign-price';
import { currencyOf, VND } from '../money/currency';
import { foreignToVnd, vndToForeignMinor } from './fx';
import {
  foreignToHome,
  homeFxRate,
  homeRate,
  homeToForeignMinor,
  priceWaitingInHome,
} from './home-fx';

const quotes: Record<string, string> = { THB: '770.17', USD: '26000', EUR: '30500' };
const dong = (code: string) => quotes[code] ?? null;
const usd = currencyOf('USD');

describe('homeRate', () => {
  it('is the đồng quote itself when home is đồng', () => {
    expect(homeRate('THB', VND, dong)).toBe('770.17');
  });

  it('divides two đồng quotes for any other home', () => {
    expect(homeRate('THB', usd, dong)).toBe('0.029621923076');
    expect(homeRate('EUR', usd, dong)).toBe('1.173076923076');
    expect(homeRate('VND', usd, dong)).toBe('0.000038461538');
  });

  it('is one in itself, and null without a quote', () => {
    expect(homeRate('USD', usd, dong)).toBe('1');
    expect(homeRate('JPY', usd, dong)).toBeNull();
    expect(homeRate('THB', currencyOf('JPY'), dong)).toBeNull();
  });
});

describe('foreignToHome', () => {
  it('agrees with the đồng conversion when home is đồng', () => {
    expect(foreignToHome('12.5', '770.17', VND)).toBe(foreignToVnd('12.5', '770.17'));
  });

  it('prices baht in cents', () => {
    const rate = homeRate('THB', usd, dong) ?? '';
    // ฿120 at 770.17₫ ÷ 26.000₫ = $3.55
    expect(foreignToHome('120', rate, usd)).toBe(355);
  });
});

describe('homeToForeignMinor', () => {
  it('agrees with the đồng conversion when home is đồng', () => {
    expect(homeToForeignMinor(100_000, VND, 2, '770.17')).toBe(
      vndToForeignMinor(100_000, { decimals: 2 }, '770.17'),
    );
  });

  it('turns cents into satang, flooring what is left', () => {
    const rate = homeRate('THB', usd, dong) ?? '';
    expect(homeToForeignMinor(355, usd, 2, rate)).toBe(11_984);
    expect(homeToForeignMinor(1_000, usd, 0, rate, 'floor')).toBe(337);
  });
});

describe('homeFxRate', () => {
  const rates = [
    { currency: 'THB', rate: '770.17', asOf: '2026-10-12', source: 'frankfurter' },
    { currency: 'USD', rate: '26000', asOf: '2026-10-11', source: 'frankfurter' },
  ];

  it('is the đồng quote itself when home is đồng', () => {
    expect(homeFxRate(rates, 'THB', VND)).toBe(rates[0]);
    expect(homeFxRate(rates, 'JPY', VND)).toBeNull();
  });

  it('divides by home’s quote, dated by the older of the two', () => {
    expect(homeFxRate(rates, 'THB', usd)).toEqual({
      currency: 'THB',
      rate: '0.029621923076',
      asOf: '2026-10-11',
      source: 'frankfurter',
    });
    expect(homeFxRate(rates, 'VND', usd)?.rate).toBe('0.000038461538');
  });

  it('is null for home itself, and without either quote', () => {
    expect(homeFxRate(rates, 'USD', usd)).toBeNull();
    expect(homeFxRate(rates, 'VND', VND)).toBeNull();
    expect(homeFxRate(rates, 'JPY', usd)).toBeNull();
    expect(homeFxRate(rates, 'THB', currencyOf('EUR'))).toBeNull();
  });
});

describe('priceWaitingInHome', () => {
  const waiting = { currency: 'IDR', amount: 496_650, fromNote: false };

  it('is priceWaiting when home is đồng', () => {
    expect(priceWaitingInHome(waiting, '1.6', VND)).toEqual(priceWaiting(waiting, '1.6'));
  });

  it('prices in cents at a rate in dollars', () => {
    // Rp496.650 at $0.0000615 = $30.54
    expect(priceWaitingInHome(waiting, '0.0000615', usd)).toEqual({
      amount: 3054,
      foreignAmount: { currency: 'IDR', amount: 496_650, rate: 0.0000615 },
    });
  });

  it('refuses a rate that is not one', () => {
    expect(priceWaitingInHome(waiting, '0', usd)).toBeNull();
    expect(priceWaitingInHome(waiting, 'abc', usd)).toBeNull();
  });
});
