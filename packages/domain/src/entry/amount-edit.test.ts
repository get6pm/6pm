import { describe, expect, it } from 'vitest';

import { editKeypadOf, editedAmount, pressEditKey } from './amount-edit';

const rupiah = { amount: 780_000, foreignAmount: { currency: 'IDR', amount: 496_650, rate: 1.57 } };
const dollars = { amount: 89_000, foreignAmount: { currency: 'USD', amount: 3.5, rate: 25_400 } };

describe('editKeypadOf', () => {
  it('opens on the đồng', () => {
    expect(editKeypadOf({ amount: 45_000, foreignAmount: null })).toEqual({
      digits: '45000',
      currency: 'VND',
    });
  });

  it('opens empty for an amount never read', () => {
    expect(editKeypadOf({ amount: 0, foreignAmount: null }).digits).toBe('');
  });

  it('opens on the foreign amount as printed, in its currency', () => {
    expect(editKeypadOf(rupiah)).toEqual({
      digits: '496650',
      currency: 'IDR',
      foreign: { code: 'IDR', decimals: 0 },
    });
    expect(editKeypadOf(dollars).digits).toBe('3.5');
  });
});

describe('pressEditKey', () => {
  const keys = editKeypadOf({ amount: 45_000, foreignAmount: null });

  it('types over the amount with the first digit', () => {
    expect(pressEditKey(keys, '5', true).digits).toBe('5');
    expect(pressEditKey(keys, '5', false).digits).toBe('450005');
  });

  it('deletes from the amount as it is', () => {
    expect(pressEditKey(keys, 'back', true).digits).toBe('4500');
  });
});

describe('editedAmount', () => {
  it('keeps đồng as typed', () => {
    expect(editedAmount({ digits: '52000', currency: 'VND' }, rupiah)).toEqual({
      amount: 52_000,
      foreignAmount: null,
    });
  });

  it('re-prices a foreign amount at the rate it was priced at', () => {
    const keys = { ...editKeypadOf(rupiah), digits: '500000' };
    expect(editedAmount(keys, rupiah)).toEqual({
      amount: 785_000,
      foreignAmount: { currency: 'IDR', amount: 500_000, rate: 1.57 },
    });
    const cents = { ...editKeypadOf(dollars), digits: '4.' };
    expect(editedAmount(cents, dollars).amount).toBe(101_600);
  });

  it('prices nothing while there is no rate', () => {
    const unpriced = { amount: 0, foreignAmount: { currency: 'IDR', amount: 1, rate: 0 } };
    expect(editedAmount({ ...editKeypadOf(unpriced), digits: '1000' }, unpriced).amount).toBe(0);
  });
});
