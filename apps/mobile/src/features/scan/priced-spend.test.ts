import { describe, expect, it } from '@jest/globals';

import { currencyOf, RATE_PENDING, VND } from '@6pm/domain';

import { dongInHome, pricedInHome } from './priced-spend';

const usd = currencyOf('USD');
// The server's quotes: đồng for one unit.
const quotes: Record<string, string> = { USD: '26000', THB: '770' };
const quote = (code: string) => quotes[code] ?? null;
const none = () => null;

describe('dongInHome', () => {
  it('keeps đồng as they are at a đồng home', () => {
    expect(dongInHome(45_000, VND, none)).toEqual({ amount: 45_000, foreignAmount: null });
  });

  it('prices đồng in dollars, keeping what was paid and the rate', () => {
    const priced = dongInHome(52_000, usd, quote);
    expect(priced.amount).toBe(200);
    expect(priced.foreignAmount?.currency).toBe('VND');
    expect(priced.foreignAmount?.amount).toBe(52_000);
    expect(priced.foreignAmount?.rate).toBeCloseTo(1 / 26_000, 12);
  });

  it('keeps the spend waiting for a rate when there is none', () => {
    expect(dongInHome(52_000, usd, none)).toEqual({
      amount: 0,
      foreignAmount: { currency: 'VND', amount: 52_000, rate: RATE_PENDING },
    });
  });
});

describe('pricedInHome', () => {
  it('prices baht in đồng exactly as before at a đồng home', () => {
    expect(pricedInHome('THB', '12.5', VND, quote)).toEqual({
      amount: 9_625,
      foreignAmount: { currency: 'THB', amount: 12.5, rate: 770 },
    });
  });

  it('prices baht in dollars through the two quotes', () => {
    // 100 baht × 770 / 26000 = 2.9615… dollars.
    expect(pricedInHome('THB', '100', usd, quote)?.amount).toBe(296);
  });

  it('keeps the home currency as it is', () => {
    expect(pricedInHome('USD', '12.5', usd, none)).toEqual({ amount: 1250, foreignAmount: null });
  });

  it('refuses an amount that is not a number', () => {
    expect(pricedInHome('THB', 'abc', usd, quote)).toBeNull();
    expect(pricedInHome('THB', '0', usd, quote)).toBeNull();
  });
});
