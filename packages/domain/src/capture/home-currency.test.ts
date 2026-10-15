import { describe, expect, it } from 'vitest';

import type { InboxSpend } from '../contracts/surfaces';
import { currencyOf } from '../money/currency';
import coffeeHouseQ12 from './fixtures/receipts/shop-coffee-house-q12.json';
import mbbank from './fixtures/receipts/synthetic-mbbank.json';
import { RATE_PENDING, settleTypedAmount, waitingForeign } from './foreign-price';
import { capturedInHome, inboxItemToNewSpend, type InboxFiling } from './inbox';
import { readReceipt } from './read-receipt';
import { parseSpokenSpend } from './spoken-spend';
import { parseWalletAmount } from './wallet-amount';

const USD = currencyOf('USD');
const CAD = currencyOf('CAD');

describe('a receipt that prints no currency, on a phone counting another', () => {
  const lines = [{ text: 'Coffee 4.50' }, { text: 'TOTAL 4.50' }];

  it('is in the home currency, cents and all', () => {
    expect(readReceipt(lines, null, null, 'USD')).toMatchObject({
      currency: 'USD',
      currencySure: false,
      amount: 450,
      foreign: null,
    });
  });

  it('cannot be in a home that has no cents when it prints them', () => {
    expect(readReceipt(lines, null, null, 'JPY')).toMatchObject({ currency: null, amount: null });
  });

  it('is still in đồng when it is written in Vietnamese', () => {
    expect(readReceipt(coffeeHouseQ12, null, null, 'USD')).toMatchObject({
      currency: 'VND',
      currencySure: true,
      amount: null,
      foreign: { currency: 'VND' },
    });
  });
});

describe('a Vietnamese bank transfer on a phone counting another currency', () => {
  it('is a foreign amount in đồng', () => {
    expect(readReceipt(mbbank, null, null, 'EUR')).toMatchObject({
      kind: 'transfer',
      currency: 'VND',
      amount: null,
      foreign: { currency: 'VND', amount: '120000' },
    });
  });
});

describe('a Wallet amount', () => {
  it('without a mark is in the home currency', () => {
    expect(parseWalletAmount('45', USD)).toEqual({ currency: 'USD', amount: 4500 });
    expect(parseWalletAmount('45')).toEqual({ currency: 'VND', amount: 45 });
  });

  it('with a bare dollar sign is home’s when home writes it so', () => {
    expect(parseWalletAmount('$3.50', CAD)).toEqual({ currency: 'CAD', amount: 350 });
    expect(parseWalletAmount('US$3.50', CAD)).toEqual({ currency: 'USD', amount: 350 });
    expect(parseWalletAmount('CAD 3.50', CAD)).toEqual({ currency: 'CAD', amount: 350 });
  });

  it('in đồng stays đồng', () => {
    expect(parseWalletAmount('45.000 ₫', USD)).toEqual({ currency: 'VND', amount: 45_000 });
  });
});

describe('a spend said out loud', () => {
  it('is read in the home currency', () => {
    expect(parseSpokenSpend('coffee, forty-five', USD).amount).toBe(4500);
    expect(parseSpokenSpend('coffee, twelve', USD).amount).toBe(1200);
    expect(parseSpokenSpend('lunch for twelve dollars', USD)).toMatchObject({
      name: 'Lunch',
      amount: 1200,
    });
  });
});

const filing = (home?: string): InboxFiling => ({
  ruleCategoryId: null,
  fallbackCategoryId: 'food',
  categoryIds: new Set(['food']),
  ...(home ? { home } : {}),
});
const shared: InboxSpend = {
  v: 1,
  id: '0b9f6a52-3c1e-4d7a-9d2e-1f0c8b7a6e51',
  kind: 'spend',
  source: 'shared',
  status: 'caught',
  at: '2026-10-12T05:10:00.000Z',
  amount: 462,
  currency: 'USD',
  merchant: 'Circle K',
  categoryId: null,
  foreign: { currency: 'VND', amount: '120000', rate: '0.0000384615' },
};

describe('an inbox item', () => {
  it('counted in the app’s home is saved as it is', () => {
    expect(inboxItemToNewSpend(shared, filing('USD'), new Date(shared.at))).toMatchObject({
      amount: 462,
      foreignAmount: { currency: 'VND', amount: 120_000, rate: 0.0000384615 },
    });
  });

  it('counted in another home waits to be priced in today’s', () => {
    const draft = inboxItemToNewSpend(shared, filing('EUR'), new Date(shared.at));
    expect(draft).toMatchObject({ amount: 0, status: 'caught' });
    expect(draft.foreignAmount).toEqual({ currency: 'VND', amount: 120_000, rate: RATE_PENDING });
  });

  it('from before items named their home is đồng', () => {
    const { currency: _, foreign: __, ...old } = shared;
    const draft = inboxItemToNewSpend({ ...old, amount: 45_000 }, filing('USD'));
    expect(draft).toMatchObject({ amount: 0, status: 'caught' });
    expect(draft.foreignAmount).toEqual({ currency: 'VND', amount: 45_000, rate: RATE_PENDING });
    expect(inboxItemToNewSpend({ ...old, amount: 45_000 }, filing())).toMatchObject({
      amount: 45_000,
      foreignAmount: null,
    });
  });

  it('in đồng on a phone counting dollars waits for its rate', () => {
    expect(capturedInHome(120_000, 'VND', 'USD')).toEqual({
      amount: 0,
      foreignAmount: { currency: 'VND', amount: 120_000, rate: RATE_PENDING },
    });
    expect(capturedInHome(120_000, 'VND', 'VND')).toEqual({ amount: 120_000, foreignAmount: null });
  });
});

describe('a foreign spend waiting for a rate', () => {
  it('includes đồng on a phone counting another currency', () => {
    const spend = {
      amount: 0,
      source: 'email',
      note: null,
      foreignAmount: { currency: 'VND', amount: 120_000, rate: RATE_PENDING },
    };
    expect(waitingForeign(spend)).toEqual({ currency: 'VND', amount: 120_000, fromNote: false });
  });

  it('settles at the home units per unit an amount typed by hand says', () => {
    const foreign = { currency: 'VND', amount: 120_000, rate: RATE_PENDING };
    expect(settleTypedAmount(foreign, { amount: 480 }, USD)?.rate).toBeCloseTo(0.00004, 12);
  });
});
