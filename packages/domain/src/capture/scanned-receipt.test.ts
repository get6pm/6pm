import { describe, expect, it } from 'vitest';

import { inboxSpendSchema, type SurfaceContext } from '../contracts/surfaces';
import coffeeBean from './fixtures/receipts/shop-coffee-bean-singapore.json';
import grabfood from './fixtures/receipts/shop-grabfood-analy.json';
import { lookedReceiptCard, scannedReceiptCard, scannedReceiptItem } from './scanned-receipt';

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
  strings: {},
  rates: [{ currency: 'SGD', rate: '19500.5' }],
};
const dollars: SurfaceContext = { ...context, currency: 'USD', rates: [] };
const now = new Date(2026, 8, 1, 10, 0);

describe('a scanned receipt', () => {
  it('reads as a shared one does', () => {
    expect(scannedReceiptCard(grabfood, context, now)).toMatchObject({
      amount: 101_500,
      currency: 'VND',
    });
  });

  it('saves the amount read when nothing was changed', () => {
    const card = scannedReceiptCard(grabfood, context, now);
    const item = inboxSpendSchema.parse(
      scannedReceiptItem(card, {}, '00000000-0000-4000-8000-00000000000a', context),
    );
    expect(item).toMatchObject({ amount: 101_500, source: 'shared', status: 'caught' });
  });

  it('saves a typed amount in the home currency, dropping the foreign total it replaces', () => {
    const card = scannedReceiptCard(coffeeBean, context, now);
    expect(card.foreign?.currency).toBe('SGD');
    const item = scannedReceiptItem(card, { amount: 250_000, categoryId: 'food' }, 'b', context);
    expect(item).toMatchObject({ amount: 250_000, categoryId: 'food' });
    expect(item?.foreign).toBeUndefined();
  });

  it('has no item while there is no amount', () => {
    const card = scannedReceiptCard([], context, now);
    expect(card.needsCheck).toBe(true);
    expect(scannedReceiptItem(card, {}, 'c', context)).toBeNull();
    expect(scannedReceiptItem(card, { amount: 45_000 }, 'c', context)).toMatchObject({
      amount: 45_000,
    });
  });

  it('counts a typed amount in a dollar home in cents, and says so', () => {
    const card = scannedReceiptCard([], dollars, now);
    const item = inboxSpendSchema.parse(
      scannedReceiptItem(card, { amount: 1_250 }, '00000000-0000-4000-8000-00000000000d', dollars),
    );
    expect(item).toMatchObject({ amount: 1_250, currency: 'USD' });
  });

  it('takes the closer look where the phone was unsure, and stops asking', () => {
    const looked = lookedReceiptCard(
      [],
      {
        receipt: {
          amount: 4_525,
          currency: 'USD',
          merchant: null,
          at: null,
          sure: true,
          currencyPrinted: true,
        },
      },
      dollars,
      now,
    );
    expect(looked).toMatchObject({ amount: 4_525, currency: 'USD', needsCheck: false });
  });
});
