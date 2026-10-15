import { describe, expect, it } from 'vitest';

import coffeeBean from '../capture/fixtures/receipts/shop-coffee-bean-singapore.json';
import kelingking from '../capture/fixtures/receipts/shop-kelingking-bali-no-mark.json';
import mbbank from '../capture/fixtures/receipts/synthetic-mbbank.json';
import {
  inboxSpendSchema,
  logSpendResultSchema,
  shareCardSchema,
  type SurfaceContext,
} from '../contracts/surfaces';
import { contextMoney } from './context-money';
import { logSpend, shareCard, shareItem, shareShown } from './entry';

const base: SurfaceContext = {
  v: 1,
  language: 'en',
  host: '6pm.ai',
  categories: [
    {
      id: 'food',
      name: 'Food',
      icon: 'restaurant',
      tile: '#f4e3c8',
      glyph: '#6b4a1f',
      countsDaily: true,
    },
  ],
  rules: [],
  safeToday: 4_000,
  strings: { today: 'Today', yesterday: 'Yesterday', safeAfter: 'Safe today is now {amount}' },
  rates: [
    { currency: 'USD', rate: '26000' },
    { currency: 'SGD', rate: '19500' },
  ],
  currency: 'USD',
  numberStyle: { languageTag: 'en-US', decimal: '.', group: ',' },
};
const usd = JSON.stringify(base);
const usdNoRates = JSON.stringify({ ...base, rates: [] });
const now = new Date(2026, 9, 9, 13, 10).toISOString();

const card = (lines: unknown, ctx = usd) =>
  shareCardSchema.parse(JSON.parse(shareCard(JSON.stringify(lines), ctx, now)));
const item = (shown: unknown, ctx = usd, edits: object = {}) =>
  inboxSpendSchema.parse(
    (
      JSON.parse(shareItem(JSON.stringify(shown), JSON.stringify(edits), ctx)) as {
        item: unknown;
      }
    ).item,
  );
const logged = (amount: string, merchant: string | null, ctx = usd) =>
  logSpendResultSchema.parse(JSON.parse(logSpend(amount, merchant, ctx, now)));

describe('the context’s home currency', () => {
  it('is đồng when the context names none, or there is no context', () => {
    expect(contextMoney(null).home.code).toBe('VND');
    expect(contextMoney({ ...base, currency: undefined }).home.code).toBe('VND');
  });

  it('prices another currency through the two đồng quotes', () => {
    const money = contextMoney(base);
    expect(money.rate('USD')).toBeNull();
    expect(Number(money.rate('SGD'))).toBeCloseTo(0.75, 10);
    expect(Number(money.rate('VND'))).toBeCloseTo(1 / 26_000, 12);
    expect(money.rate('THB')).toBeNull();
  });
});

describe('Log in 6pm on a phone counting dollars', () => {
  it('takes a Wallet amount in dollars as it is', () => {
    const result = logged('$3.50', 'Blue Bottle');
    expect(result.item).toMatchObject({ amount: 350, currency: 'USD', source: 'applePay' });
    expect(result.item?.foreign).toBeUndefined();
    expect(result.amountText).toBe('$3.50');
    expect(result.safeAfterText).toBe('Safe today is now $37');
  });

  it('prices a Wallet amount in another currency at the app’s rates', () => {
    const result = logged('S$10.00', 'Kopitiam');
    expect(result.item).toMatchObject({
      amount: 750,
      currency: 'USD',
      foreign: { currency: 'SGD', amount: '10.00' },
    });
    expect(Number(result.item?.foreign?.rate)).toBeCloseTo(0.75, 10);
    expect(result.amountText).toBe('$7.50');
  });

  it('leaves one it has no rate for waiting for a rate', () => {
    const result = logged('S$10.00', 'Kopitiam', usdNoRates);
    expect(result.item).toMatchObject({
      amount: null,
      foreign: { currency: 'SGD', amount: '10.00' },
    });
    expect(result.item?.foreign?.rate).toBeUndefined();
    expect(result.amountText).toBe('S$10');
  });

  it('reads what was said to Siri in dollars', () => {
    expect(logged('coffee, twelve', null).item).toMatchObject({ amount: 1200, source: 'voice' });
  });
});

describe('a shared receipt on a phone counting dollars', () => {
  it('reads a Vietnamese bank’s đồng as a foreign amount, priced in dollars', () => {
    const read = card(mbbank);
    expect(read).toMatchObject({
      home: 'USD',
      kind: 'transfer',
      currency: 'VND',
      amount: 462,
      amountText: '120.000₫',
      amountParts: { prefix: '', number: '120.000₫', suffix: '' },
      inHomeText: '$4.62',
      foreign: { currency: 'VND', amount: '120000' },
      currencies: [],
    });
    expect(item(read)).toMatchObject({
      amount: 462,
      currency: 'USD',
      foreign: { currency: 'VND', amount: '120000' },
    });
  });

  it('keeps the đồng waiting without the quotes to price it', () => {
    const read = card(mbbank, usdNoRates);
    expect(read).toMatchObject({ amount: null, inHomeText: null, amountText: '120.000₫' });
    const saved = item(read, usdNoRates);
    expect(saved.amount).toBeNull();
    expect(saved.foreign).toEqual({ currency: 'VND', amount: '120000' });
  });

  it('writes a foreign shop receipt in the phone’s number style', () => {
    expect(card(coffeeBean)).toMatchObject({
      currency: 'SGD',
      amount: 5160,
      amountText: 'S$68.80',
      inHomeText: '$51.60',
      editText: '68.80',
    });
  });

  it('takes a receipt in the home currency as the amount, its symbol drawn on its side', () => {
    const sgd = JSON.stringify({ ...base, currency: 'SGD' });
    expect(card(coffeeBean, sgd)).toMatchObject({
      currency: 'SGD',
      amount: 6880,
      amountText: '$68.80',
      amountParts: { prefix: '$', number: '68.80', suffix: '' },
      inHomeText: null,
      editText: '68.80',
      decimalEntry: true,
      foreign: null,
    });
  });

  it('offers home and đồng when the currency is a guess', () => {
    const codes = card(kelingking).currencies.map((c) => c.code);
    expect(codes).toContain('USD');
    expect(codes).toContain('VND');
  });

  it('reads an amount typed in Edit in dollars', () => {
    const read = card(coffeeBean);
    const shown = JSON.parse(
      shareShown(
        JSON.stringify(read),
        JSON.stringify({ currency: 'USD', amountText: '12.5' }),
        usd,
      ),
    ) as Record<string, unknown>;
    expect(shown).toMatchObject({
      amount: 1250,
      amountText: '$12.50',
      amountParts: { prefix: '$', number: '12.50', suffix: '' },
      decimalEntry: true,
      canConfirm: true,
    });
  });
});
