import { describe, expect, it } from 'vitest';

import { inboxItemSchema, type InboxSpend } from '../contracts/surfaces';
import {
  REPEAT_TAP_WINDOW_MS,
  inboxItemToNewSpend,
  isRepeatTap,
  isSameReceipt,
  numbersFree,
  receiptBankOf,
  receiptDetail,
  type CapturedSpend,
  type InboxFiling,
} from './inbox';

const tap: InboxSpend = {
  v: 1,
  id: '0b9f6a52-3c1e-4d7a-9d2e-1f0c8b7a6e51',
  kind: 'spend',
  source: 'applePay',
  status: 'caught',
  at: '2026-10-12T05:10:00.000Z',
  amount: 45_000,
  merchant: 'Phở Hòa ',
  categoryId: null,
};
const filing: InboxFiling = {
  ruleCategoryId: null,
  fallbackCategoryId: 'food',
  categoryIds: new Set(['food', 'drinks', 'transport']),
};
const shifted = (ms: number) => new Date(Date.parse(tap.at) + ms).toISOString();
const seen = (patch: Partial<CapturedSpend> = {}): CapturedSpend => ({
  source: 'applePay',
  merchant: 'phở hòa',
  amount: 45_000,
  at: tap.at,
  ...patch,
});

describe('inboxItemToNewSpend', () => {
  it('keeps the item id, time and status, and trims the merchant', () => {
    const draft = inboxItemToNewSpend(tap, filing);
    expect(draft).toMatchObject({
      id: tap.id,
      amount: 45_000,
      merchant: 'Phở Hòa',
      source: 'applePay',
      status: 'caught',
      categoryId: 'food',
      detail: null,
      note: null,
    });
    expect(draft.at.toISOString()).toBe(tap.at);
  });

  it('files under the extension’s category, then the rule, then the fallback', () => {
    expect(inboxItemToNewSpend({ ...tap, categoryId: 'drinks' }, filing).categoryId).toBe('drinks');
    const ruled = { ...filing, ruleCategoryId: 'transport' };
    expect(inboxItemToNewSpend(tap, ruled).categoryId).toBe('transport');
    expect(inboxItemToNewSpend({ ...tap, categoryId: 'drinks' }, ruled).categoryId).toBe('drinks');
  });

  it('keeps a priced foreign amount beside its đồng, and none without a rate', () => {
    const foreign = { currency: 'SGD', amount: '68.80', rate: '19500.5' };
    expect(
      inboxItemToNewSpend({ ...tap, amount: 1_341_634, foreign }, filing).foreignAmount,
    ).toEqual({ currency: 'SGD', amount: 68.8, rate: 19_500.5 });
    const unpriced = { ...tap, amount: null, foreign: { currency: 'SGD', amount: '68.80' } };
    expect(inboxItemToNewSpend(unpriced, filing)).toMatchObject({ amount: 0, foreignAmount: null });
    expect(inboxItemToNewSpend(tap, filing).foreignAmount).toBeNull();
  });

  it('ignores a category archived since the extension last read the context', () => {
    expect(inboxItemToNewSpend({ ...tap, categoryId: 'gone' }, filing).categoryId).toBe('food');
  });

  it('saves an unreadable amount as 0 and leaves it for the close', () => {
    const voice: InboxSpend = { ...tap, source: 'voice', status: 'kept', amount: null };
    expect(inboxItemToNewSpend(voice, filing)).toMatchObject({ amount: 0, status: 'caught' });
  });

  it('writes the receipt’s bank and code as the detail', () => {
    const shared: InboxSpend = {
      ...tap,
      source: 'shared',
      receipt: { bank: 'Vietcombank', code: 'FT26285ABC', namingLines: [] },
    };
    expect(inboxItemToNewSpend(shared, filing).detail).toBe('Vietcombank · FT26285ABC');
    expect(receiptDetail({ namingLines: [] })).toBeNull();
    expect(receiptDetail({ code: 'X1', namingLines: [] })).toBe('X1');
  });
});

describe('receiptBankOf', () => {
  it('reads the bank back from a receipt’s detail line', () => {
    expect(receiptBankOf('Vietcombank · FT26285ABC')).toBe('Vietcombank');
    expect(receiptBankOf('MB Bank')).toBe('MB Bank');
  });

  it('is null for a code alone, nothing, or a line no bank wrote', () => {
    expect(receiptBankOf('FT26285ABC')).toBeNull();
    expect(receiptBankOf(null)).toBeNull();
    expect(receiptBankOf('')).toBeNull();
  });
});

describe('isRepeatTap', () => {
  it('is the same Wallet tap within two minutes, either way, any letter case', () => {
    expect(isRepeatTap(tap, seen())).toBe(true);
    expect(isRepeatTap({ ...tap, at: shifted(REPEAT_TAP_WINDOW_MS) }, seen())).toBe(true);
    expect(isRepeatTap({ ...tap, at: shifted(-REPEAT_TAP_WINDOW_MS) }, seen())).toBe(true);
    expect(isRepeatTap({ ...tap, at: shifted(REPEAT_TAP_WINDOW_MS + 1) }, seen())).toBe(false);
  });

  it('needs the same amount, merchant and the Wallet source on both', () => {
    expect(isRepeatTap(tap, seen({ amount: 46_000 }))).toBe(false);
    expect(isRepeatTap(tap, seen({ merchant: 'Cộng Cà Phê' }))).toBe(false);
    expect(isRepeatTap(tap, seen({ source: 'qr' }))).toBe(false);
    expect(isRepeatTap({ ...tap, source: 'voice' }, seen({ source: 'voice' }))).toBe(false);
  });
});

describe('isSameReceipt', () => {
  const shared: InboxSpend = {
    ...tap,
    source: 'shared',
    receipt: { bank: 'MB Bank', code: 'FT1', namingLines: [] },
  };

  it('matches a shared spend from the same bank and code', () => {
    expect(isSameReceipt(shared, seen({ source: 'shared', detail: 'MB Bank · FT1' }))).toBe(true);
  });

  it('never matches without a code, another code or another source', () => {
    const noCode: InboxSpend = { ...shared, receipt: { bank: 'MB Bank', namingLines: [] } };
    expect(isSameReceipt(noCode, seen({ source: 'shared', detail: 'MB Bank' }))).toBe(false);
    expect(isSameReceipt(shared, seen({ source: 'shared', detail: 'MB Bank · FT2' }))).toBe(false);
    expect(isSameReceipt(shared, seen({ source: 'qr', detail: 'MB Bank · FT1' }))).toBe(false);
  });
});

describe('numbersFree', () => {
  it('drops every word holding a digit and lines left without letters', () => {
    expect(
      numbersFree([
        'Chuyển tiền thành công',
        '45.000 VND',
        'Tới: PHO HOA PASTEUR',
        'STK 0123456789',
        '12/10/2026 18:04',
        'Mã GD: FT26285ABC',
        '---',
      ]),
    ).toEqual(['Chuyển tiền thành công', 'VND', 'Tới: PHO HOA PASTEUR', 'STK', 'Mã GD:']);
  });
});

describe('inbox contract', () => {
  it('accepts a paid event and rejects an unknown version', () => {
    const paid = { v: 1, id: tap.id, kind: 'paid', spendId: 's1', at: tap.at };
    expect(inboxItemSchema.safeParse(paid).success).toBe(true);
    expect(inboxItemSchema.safeParse({ ...paid, v: 2 }).success).toBe(false);
    expect(inboxItemSchema.safeParse(tap).success).toBe(true);
  });
});
