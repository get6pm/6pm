import { describe, expect, it } from 'vitest';

import {
  priceWaiting,
  RATE_PENDING,
  rateDayOf,
  readForeignNote,
  settleTypedAmount,
  waitingForeign,
} from './foreign-price';

const saved = {
  amount: 0,
  source: 'shared',
  note: null,
  foreignAmount: { currency: 'IDR', amount: 496_650, rate: 0 },
};

describe('readForeignNote', () => {
  it('reads back an amount exactly as the share card printed it', () => {
    expect(readForeignNote('Rp496.650')).toEqual({ currency: 'IDR', amount: 496_650 });
    expect(readForeignNote('S$68,80')).toEqual({ currency: 'SGD', amount: 68.8 });
    expect(readForeignNote('$12,50')).toEqual({ currency: 'USD', amount: 12.5 });
    expect(readForeignNote('฿1.200')).toEqual({ currency: 'THB', amount: 1_200 });
  });

  it('never takes a note someone wrote for an amount', () => {
    for (const note of [null, '', 'Rp', 'Lunch Rp496.650', 'Rp496650x', 'S$68,8', 'Rp496,650']) {
      expect(readForeignNote(note)).toBeNull();
    }
  });
});

describe('waitingForeign', () => {
  it('finds a foreign amount saved with its rate pending', () => {
    expect(waitingForeign(saved)).toEqual({ currency: 'IDR', amount: 496_650, fromNote: false });
  });

  it('finds a shared receipt saved at 0₫ with its printed amount in the note', () => {
    const older = { ...saved, foreignAmount: null, note: 'Rp496.650' };
    expect(waitingForeign(older)).toEqual({ currency: 'IDR', amount: 496_650, fromNote: true });
    expect(waitingForeign({ ...older, source: 'manual' })).toBeNull();
  });

  it('leaves alone what is priced, or has an amount the person gave it', () => {
    expect(waitingForeign({ ...saved, foreignAmount: { ...saved.foreignAmount, rate: 1.6 } })).toBe(
      null,
    );
    expect(waitingForeign({ ...saved, amount: 800_000 })).toBeNull();
    expect(waitingForeign({ ...saved, foreignAmount: null })).toBeNull();
  });

  it('leaves alone a currency 6pm has no rate for', () => {
    const franc = { ...saved, foreignAmount: { currency: 'CHF', amount: 12, rate: 0 } };
    expect(waitingForeign(franc)).toBeNull();
  });
});

describe('pricing at the rate of the receipt’s day', () => {
  it('takes the phone’s calendar day the receipt was paid', () => {
    expect(rateDayOf(new Date(2026, 8, 2, 11, 55))).toBe('2026-09-02');
    expect(rateDayOf(new Date(2026, 8, 2, 23, 59))).toBe('2026-09-02');
  });

  it('prices exactly, to the nearest đồng', () => {
    const waiting = { currency: 'IDR', amount: 496_650, fromNote: false };
    expect(priceWaiting(waiting, '1.6')).toEqual({
      amount: 794_640,
      foreignAmount: { currency: 'IDR', amount: 496_650, rate: 1.6 },
    });
    const cents = { currency: 'SGD', amount: 68.8, fromNote: false };
    expect(priceWaiting(cents, '19500.5')?.amount).toBe(1_341_634);
  });

  it('refuses a rate that is not one', () => {
    const waiting = { currency: 'IDR', amount: 496_650, fromNote: false };
    expect(priceWaiting(waiting, '0')).toBeNull();
    expect(priceWaiting(waiting, 'soon')).toBeNull();
  });
});

describe('a đồng amount typed for a waiting foreign spend', () => {
  const waiting = { currency: 'IDR', amount: 496_650, rate: RATE_PENDING };

  it('takes the rate the person paid at', () => {
    expect(settleTypedAmount(waiting, { amount: 794_640 })).toEqual({
      currency: 'IDR',
      amount: 496_650,
      rate: 794_640 / 496_650,
    });
  });

  it('leaves priced spends, đồng spends and other edits alone', () => {
    expect(settleTypedAmount({ ...waiting, rate: 1.6 }, { amount: 800_000 })).toBeUndefined();
    expect(settleTypedAmount(null, { amount: 800_000 })).toBeUndefined();
    expect(settleTypedAmount(waiting, { amount: 0 })).toBeUndefined();
    expect(settleTypedAmount(waiting, {})).toBeUndefined();
    expect(settleTypedAmount(waiting, { amount: 9, foreignAmount: null })).toBeUndefined();
  });
});
