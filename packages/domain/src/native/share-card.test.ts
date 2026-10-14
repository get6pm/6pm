import { describe, expect, it } from 'vitest';

import coffeeBean from '../capture/fixtures/receipts/shop-coffee-bean-singapore.json';
import grabfood from '../capture/fixtures/receipts/shop-grabfood-analy.json';
import kelingking from '../capture/fixtures/receipts/shop-kelingking-bali-no-mark.json';
import mbbank from '../capture/fixtures/receipts/synthetic-mbbank.json';
import { inboxSpendSchema, shareCardSchema, type SurfaceContext } from '../contracts/surfaces';
import { shareCard, shareItem, shareShown } from './entry';

const context: SurfaceContext = {
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
  safeToday: 2_000_000,
  strings: { today: 'Today', yesterday: 'Yesterday', safeAfter: 'Safe today is now {amount}' },
  rates: [
    { currency: 'SGD', rate: '19500.5' },
    { currency: 'IDR', rate: '1.6' },
  ],
};
const withRates = JSON.stringify(context);
const noRates = JSON.stringify({ ...context, rates: [] });
const now = new Date(2026, 8, 1, 10, 0).toISOString();

const card = (lines: unknown, ctx = withRates) =>
  shareCardSchema.parse(JSON.parse(shareCard(JSON.stringify(lines), ctx, now)));
const item = (shown: unknown, edits: object = {}) =>
  inboxSpendSchema.parse(
    (JSON.parse(shareItem(JSON.stringify(shown), JSON.stringify(edits))) as { item: unknown }).item,
  );

describe('a receipt in another currency', () => {
  it('shows its own amount, with đồng at the app’s rate', () => {
    expect(card(coffeeBean)).toMatchObject({
      kind: 'shop',
      currency: 'SGD',
      amount: 1_341_634,
      amountText: 'S$68,80',
      inDongText: '1.341.634₫',
      editText: '68,80',
      decimalEntry: true,
      foreign: { currency: 'SGD', amount: '68.80', rate: '19500.5' },
      needsCheck: true,
    });
  });

  it('is saved in đồng with the foreign amount and the rate beside it', () => {
    expect(item(card(coffeeBean))).toMatchObject({
      amount: 1_341_634,
      foreign: { currency: 'SGD', amount: '68.80', rate: '19500.5' },
    });
  });

  it('keeps its own amount, and leaves the đồng to the close, with no rate yet', () => {
    const unpriced = card(coffeeBean, noRates);
    expect(unpriced).toMatchObject({ amount: null, amountText: 'S$68,80', inDongText: null });
    const saved = item(unpriced);
    expect(saved).toMatchObject({ amount: null, note: 'S$68,80' });
    expect(saved.foreign).toEqual({ currency: 'SGD', amount: '68.80' });
  });

  it('reads an amount typed in Edit in that currency', () => {
    const shown = JSON.parse(shareShown(JSON.stringify(card(coffeeBean)), '{"amountText":"70,5"}'));
    expect(shown).toMatchObject({ amountText: 'S$70,50', amount: 1_374_785, canConfirm: true });
  });

  it('can be switched to đồng when the guess was wrong', () => {
    const guessed = card(kelingking);
    expect(guessed.currencies.map((c) => c.code)).toEqual(['IDR', 'VND']);
    expect(item(guessed, { currency: 'VND' })).toMatchObject({ amount: 935_550 });
    expect(item(guessed, { currency: 'VND' }).foreign).toBeUndefined();
  });
});

describe('a shop receipt in đồng', () => {
  it('is read from its total, not the discount', () => {
    expect(card(grabfood)).toMatchObject({ amount: 101_500, amountText: '101.500₫' });
  });
});
