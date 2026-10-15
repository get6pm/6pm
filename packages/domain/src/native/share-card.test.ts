import { describe, expect, it } from 'vitest';

import bejana from '../capture/fixtures/receipts/shop-bejana-uluwatu-no-mark.json';
import coffeeBean from '../capture/fixtures/receipts/shop-coffee-bean-singapore.json';
import grabfood from '../capture/fixtures/receipts/shop-grabfood-analy.json';
import kelingking from '../capture/fixtures/receipts/shop-kelingking-bali-no-mark.json';
import mbbank from '../capture/fixtures/receipts/synthetic-mbbank.json';
import { inboxSpendSchema, shareCardSchema, type SurfaceContext } from '../contracts/surfaces';
import { shareCard, shareItem, shareLook, shareShown } from './entry';

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
    const shown: unknown = JSON.parse(
      shareShown(JSON.stringify(card(coffeeBean)), '{"amountText":"70,5"}'),
    );
    expect(shown).toMatchObject({ amountText: 'S$70,50', amount: 1_374_785, canConfirm: true });
  });

  it('can be switched to đồng when the guess was wrong', () => {
    const guessed = card(kelingking);
    expect(guessed.currencies.map((c) => c.code)).toEqual([
      'IDR',
      'VND',
      'THB',
      'SGD',
      'MYR',
      'USD',
      'EUR',
      'JPY',
      'KRW',
      'CNY',
    ]);
    expect(item(guessed, { currency: 'VND' })).toMatchObject({ amount: 935_550 });
    expect(item(guessed, { currency: 'VND' }).foreign).toBeUndefined();
  });

  it('marks a currency it guessed, until the person picks one', () => {
    const guessed = card(kelingking);
    expect(guessed).toMatchObject({ currencyGuessed: true, currencySure: false });
    expect(item(guessed)).toMatchObject({ currencyGuessed: true, amount: 1_496_880 });
    expect(item(guessed, { currency: 'IDR' }).currencyGuessed).toBeUndefined();
    const switched = item(guessed, { currency: 'SGD' });
    expect(switched.foreign).toEqual({ currency: 'SGD', amount: '935550', rate: '19500.5' });
    expect(switched.currencyGuessed).toBeUndefined();
  });

  it('never marks a printed currency or a transfer as a guess', () => {
    expect(card([{ text: 'Kopi' }, { text: 'TOTAL S$12.50' }]).currencyGuessed).toBe(false);
    expect(card(mbbank)).toMatchObject({ currencyGuessed: false, currencies: [] });
    expect(item(card(mbbank)).currencyGuessed).toBeUndefined();
  });
});

describe('where the photo was taken', () => {
  const uluwatu = JSON.stringify({ latitude: -8.83, longitude: 115.09 });
  const saigon = JSON.stringify({ latitude: 10.78, longitude: 106.7 });
  const at = (lines: unknown, place: string) =>
    shareCardSchema.parse(JSON.parse(shareCard(JSON.stringify(lines), withRates, now, place)));

  it('names the currency of a receipt that prints none', () => {
    expect(at(bejana, uluwatu)).toMatchObject({ currency: 'IDR', amountText: 'Rp368.160' });
    expect(at(kelingking, saigon)).toMatchObject({ currency: 'VND', currencySure: false });
  });

  it('never overrules a printed currency or a Vietnamese bill', () => {
    expect(at([{ text: 'Kopi' }, { text: 'TOTAL S$12.50' }], uluwatu).currency).toBe('SGD');
    expect(at(grabfood, uluwatu)).toMatchObject({ currency: 'VND', amount: 101_500 });
  });

  it('is ignored when it is not a place', () => {
    expect(at(grabfood, '{"latitude":"x"}').amount).toBe(101_500);
  });
});

describe('a shop receipt in đồng', () => {
  it('is read from its total, not the discount', () => {
    expect(card(grabfood)).toMatchObject({ amount: 101_500, amountText: '101.500₫' });
  });
});

describe('shareLook', () => {
  const look = (receipt: object | null, lines: unknown = grabfood) =>
    shareCardSchema.parse(
      JSON.parse(shareLook(JSON.stringify(lines), JSON.stringify({ receipt }), withRates, now)),
    );

  it('takes what the server is sure of where the phone was not', () => {
    const merged = look({
      amount: 101_500,
      currency: 'VND',
      merchant: 'Cơm Gà Hải Nam',
      at: null,
      sure: true,
    });
    expect(merged).toMatchObject({
      amount: 101_500,
      payee: 'Cơm Gà Hải Nam',
      totalSure: true,
      needsCheck: false,
    });
  });

  it('never takes a shop name the photo did not print', () => {
    const merged = look({
      amount: 101_500,
      currency: 'VND',
      merchant: 'Phở 24',
      at: null,
      sure: true,
    });
    expect(merged.payee).toBe('Cơm Gà Hải Nam Tam Kỳ 142 - Bình Chánh');
  });

  it('reads rupiah from the server as whole units', () => {
    const merged = look(
      { amount: 935_550, currency: 'IDR', merchant: 'Kelingking', at: null, sure: true },
      kelingking,
    );
    expect(merged).toMatchObject({ printed: '935550', currencySure: true, payee: 'Kelingking' });
  });

  it('keeps what the phone read surely over a server that is unsure', () => {
    const merged = look(
      { amount: 999_000, currency: 'VND', merchant: null, at: null, sure: false },
      mbbank,
    );
    expect(merged).toMatchObject({ amount: 120_000, payee: 'CIRCLE K VN' });
  });

  it('takes a currency the server read printed over the phone’s guess', () => {
    const merged = look(
      {
        amount: 368_160,
        currency: 'IDR',
        merchant: null,
        at: null,
        sure: true,
        currencyPrinted: true,
      },
      [{ text: 'GRAND TOTAL 368,160' }],
    );
    expect(merged).toMatchObject({ currency: 'IDR', currencyGuessed: false, printed: '368160' });
  });

  it('keeps the photo’s place over a server that only inferred the country', () => {
    const lines = [{ text: 'GRAND TOTAL 368,160' }];
    const uluwatu = JSON.stringify({ latitude: -8.83, longitude: 115.09 });
    const answer = JSON.stringify({
      receipt: {
        amount: 368_160,
        currency: 'VND',
        merchant: null,
        at: null,
        sure: true,
        currencyPrinted: false,
      },
    });
    const merged = shareCardSchema.parse(
      JSON.parse(shareLook(JSON.stringify(lines), answer, withRates, now, uluwatu)),
    );
    expect(merged).toMatchObject({ currency: 'IDR', currencyGuessed: true });
  });

  it('takes a sure server’s inferred currency over a guess from nothing, still as a guess', () => {
    const merged = look(
      {
        amount: 368_160,
        currency: 'IDR',
        merchant: null,
        at: null,
        sure: true,
        currencyPrinted: false,
      },
      [{ text: 'GRAND TOTAL 368,160' }],
    );
    expect(merged).toMatchObject({ currency: 'IDR', currencyGuessed: true });
  });

  it('converts the server’s cents for a currency with them', () => {
    const merged = look(
      { amount: 6_880, currency: 'SGD', merchant: null, at: '2026-08-29T19:14:00', sure: true },
      coffeeBean,
    );
    expect(merged).toMatchObject({ currency: 'SGD', printed: '68.80', currencySure: true });
  });

  it('leaves the card as the phone read it when the server could not read the photo', () => {
    expect(look(null)).toMatchObject({ amount: 101_500, needsCheck: false });
    const broken: unknown = JSON.parse(shareLook(JSON.stringify(grabfood), 'nope', withRates, now));
    expect(shareCardSchema.parse(broken).amount).toBe(101_500);
  });
});
