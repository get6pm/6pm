import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  inboxSpendSchema,
  logSpendResultSchema,
  shareCardSchema,
  type SurfaceContext,
} from '../contracts/surfaces';
import mbbank from '../capture/fixtures/receipts/synthetic-mbbank.json';
import momo from '../capture/fixtures/receipts/synthetic-momo.json';
import textShare from '../capture/fixtures/receipts/synthetic-text-share.json';
import { NATIVE_API_VERSION, logSpend, shareCard, shareItem } from './entry';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const category = (id: string, name: string, countsDaily = true) => ({
  id,
  name,
  icon: 'restaurant',
  tile: '#f4e3c8',
  glyph: '#6b4a1f',
  countsDaily,
});

const context: SurfaceContext = {
  v: 1,
  language: 'en',
  host: '6pm.ai',
  categories: [
    category('food', 'Food'),
    category('drinks', 'Drinks'),
    category('transport', 'Transport'),
    category('groceries', 'Groceries'),
    category('shopping', 'Shopping'),
    category('work', 'Work', false),
  ],
  rules: [{ key: 'circle k vn', categoryId: 'groceries' }],
  safeToday: 245_000,
  strings: { today: 'Today', yesterday: 'Yesterday', safeAfter: 'Safe today is now {amount}' },
};
const contextJson = JSON.stringify(context);
/** On the phone's clock: the day of the fixtures, a little after lunch. */
const now = new Date(2026, 9, 9, 13, 10).toISOString();

const card = (lines: unknown, ctx = contextJson, at = now) =>
  shareCardSchema.parse(JSON.parse(shareCard(JSON.stringify(lines), ctx, at)));
const logged = (amount: string, merchant: string | null, ctx = contextJson) =>
  logSpendResultSchema.parse(JSON.parse(logSpend(amount, merchant, ctx, now)));

describe('the native entry', () => {
  it('is the version the extensions were written against', () => {
    expect(NATIVE_API_VERSION).toBe(3);
  });
});

describe('shareCard', () => {
  it('reads a receipt into the card, filed by the merchant rule', () => {
    expect(card(mbbank)).toEqual({
      amount: 120_000,
      payee: 'CIRCLE K VN',
      payeeSure: false,
      at: new Date(2026, 9, 9, 16, 40).toISOString(),
      code: 'FT26282917400',
      bank: 'MB Bank',
      categoryId: 'groceries',
      amountText: '120.000₫',
      safeAfterText: 'Safe today is now 125k',
      categoryName: 'Groceries',
      whenText: 'Today · 16:40',
      namingLines: expect.arrayContaining(['MBBank', 'Tên người nhận CIRCLE K VN']) as string[],
      atRead: true,
      kind: 'transfer',
      currency: 'VND',
      currencySure: true,
      totalSure: true,
      totalLine: null,
      printed: '120000',
      foreign: null,
      inDongText: null,
      editText: '120.000',
      decimalEntry: false,
      currencies: [],
      needsCheck: false,
    });
  });

  it('keeps every number out of the naming lines', () => {
    for (const line of card(mbbank).namingLines) expect(line).not.toMatch(/\d/);
  });

  it('files by the words when no rule matches', () => {
    expect(card(momo)).toMatchObject({ categoryId: 'food', payeeSure: true });
    expect(card(textShare)).toMatchObject({ categoryId: 'transport', bank: 'Techcombank' });
  });

  it('says yesterday, or the date, for an older receipt', () => {
    const tomorrow = new Date(2026, 9, 10, 9, 0).toISOString();
    const tenDaysOn = new Date(2026, 9, 20, 9, 0).toISOString();
    expect(card(momo, contextJson, tomorrow).whenText).toBe('Yesterday · 18:02');
    expect(card(momo, contextJson, tenDaysOn).whenText).toBe('09/10 · 18:02');
  });

  it('works before the app has written a context', () => {
    expect(card(mbbank, '')).toMatchObject({
      amount: 120_000,
      categoryId: null,
      categoryName: null,
      safeAfterText: null,
      whenText: '09/10 · 16:40',
    });
  });

  it('gives an empty card, never an error, for input it cannot read', () => {
    for (const lines of ['not json', '{"text":"x"}', '[{"box":1}]', '']) {
      const read = shareCardSchema.parse(JSON.parse(shareCard(lines, contextJson, now)));
      expect(read).toMatchObject({ amount: null, payee: '', payeeSure: false, amountText: '' });
      expect(read.at).toBe(now);
    }
  });

  it('uses the phone clock when the time it was given is unreadable', () => {
    const read = shareCardSchema.parse(JSON.parse(shareCard('[]', contextJson, 'soon')));
    expect(Number.isNaN(Date.parse(read.at))).toBe(false);
  });
});

describe('shareItem', () => {
  it('makes the caught inbox item Confirm writes', () => {
    const shown = shareCard(JSON.stringify(mbbank), contextJson, now);
    const { item } = JSON.parse(shareItem(shown, '{}')) as { item: unknown };
    expect(inboxSpendSchema.parse(item)).toEqual({
      v: 1,
      id: expect.stringMatching(UUID_V4) as string,
      kind: 'spend',
      source: 'shared',
      status: 'caught',
      at: new Date(2026, 9, 9, 16, 40).toISOString(),
      amount: 120_000,
      merchant: 'CIRCLE K VN',
      categoryId: 'groceries',
      receipt: {
        bank: 'MB Bank',
        code: 'FT26282917400',
        namingLines: expect.any(Array) as string[],
        payeeSure: false,
      },
    });
  });

  it('counts a name the user typed as sure, so the app does not rename it', () => {
    const shown = shareCard(JSON.stringify(mbbank), contextJson, now);
    const { item } = JSON.parse(shareItem(shown, JSON.stringify({ payee: 'Circle K' }))) as {
      item: unknown;
    };
    expect(inboxSpendSchema.parse(item).receipt?.payeeSure).toBe(true);
  });

  it('still reads an inbox file written before the payee was marked sure or not', () => {
    const shown = shareCard(JSON.stringify(mbbank), contextJson, now);
    const { item } = JSON.parse(shareItem(shown, '{}')) as {
      item: { receipt: Record<string, unknown> };
    };
    delete item.receipt['payeeSure'];
    expect(inboxSpendSchema.safeParse(item).success).toBe(true);
  });

  it('applies the edits, reading the amount as typed', () => {
    const shown = shareCard(JSON.stringify(mbbank), contextJson, now);
    const edits = JSON.stringify({
      amountText: '125',
      payee: ' Circle K ',
      categoryId: 'shopping',
    });
    const { item } = JSON.parse(shareItem(shown, edits)) as { item: unknown };
    expect(inboxSpendSchema.parse(item)).toMatchObject({
      amount: 125_000,
      merchant: 'Circle K',
      categoryId: 'shopping',
    });
  });

  it('has no item while there is no amount, or for a card it cannot read', () => {
    const empty = shareCard('[]', contextJson, now);
    expect(JSON.parse(shareItem(empty, '{}'))).toEqual({ item: null });
    expect(JSON.parse(shareItem(empty, '{"amountText":"abc"}'))).toEqual({ item: null });
    expect(JSON.parse(shareItem('nope', '{}'))).toEqual({ item: null });
    const typed = JSON.parse(shareItem(empty, '{"amountText":"45k"}')) as {
      item: { amount: number };
    };
    expect(typed.item.amount).toBe(45_000);
  });
});

describe('logSpend', () => {
  it('logs a Wallet tap as caught Apple Pay', () => {
    const result = logged('₫45,000', 'Phở Hòa');
    expect(result).toEqual({
      item: {
        v: 1,
        id: expect.stringMatching(UUID_V4) as string,
        kind: 'spend',
        source: 'applePay',
        status: 'caught',
        at: now,
        amount: 45_000,
        merchant: 'Phở Hòa',
        categoryId: 'food',
      },
      needsAmount: false,
      amountText: '45.000₫',
      title: 'Phở Hòa · Food',
      safeAfterText: 'Safe today is now 200k',
    });
  });

  it.each([['0.0'], [''], ['Amount']])(
    'still logs a tap whose amount Wallet sent as %j',
    (amount) => {
      const result = logged(amount, 'CIRCLE K VN');
      expect(result.needsAmount).toBe(false);
      expect(result.item).toMatchObject({ source: 'applePay', status: 'caught', amount: null });
      expect(result.amountText).toBe('0₫');
      expect(result.safeAfterText).toBeNull();
    },
  );

  it('keeps a foreign amount as the note for the close to settle', () => {
    expect(logged('$3.50', 'Starbucks SG').item).toMatchObject({
      amount: null,
      note: '$3.50',
      categoryId: 'drinks',
    });
  });

  it('logs what was said to Siri as kept voice', () => {
    expect(logged('trà sữa with pearls, forty-five k', null)).toMatchObject({
      item: {
        source: 'voice',
        status: 'kept',
        amount: 45_000,
        merchant: 'Trà sữa',
        categoryId: 'drinks',
      },
      title: 'Trà sữa · Drinks',
      amountText: '45.000₫',
    });
    expect(logged('45k', '').item).toMatchObject({ source: 'voice', merchant: '', amount: 45_000 });
  });

  it('asks again when Siri heard no amount', () => {
    for (const said of ['', 'phở', 'zero']) {
      expect(logged(said, null)).toEqual({
        item: null,
        needsAmount: true,
        amountText: '',
        title: '',
        safeAfterText: null,
      });
    }
  });

  it('has no safe line for a category that does not count daily', () => {
    const work = JSON.stringify({ ...context, rules: [{ key: 'wework', categoryId: 'work' }] });
    expect(logged('₫120,000', 'WeWork', work)).toMatchObject({
      item: { categoryId: 'work' },
      title: 'WeWork · Work',
      safeAfterText: null,
    });
  });

  it('files by the hour when the words say nothing', () => {
    expect(logged('₫45,000', 'Cửa hàng 24').item?.categoryId).toBe('food');
  });

  it('logs with no category before the app has written a context', () => {
    expect(logged('₫45,000', 'Phở Hòa', '{}')).toMatchObject({
      item: { categoryId: null, amount: 45_000 },
      title: 'Phở Hòa',
      safeAfterText: null,
    });
  });

  it('never throws across the bridge', () => {
    fc.assert(
      fc.property(fc.string(), fc.option(fc.string()), fc.string(), (amount, merchant, ctx) => {
        logSpendResultSchema.parse(JSON.parse(logSpend(amount, merchant, ctx, now)));
      }),
    );
  });
});
