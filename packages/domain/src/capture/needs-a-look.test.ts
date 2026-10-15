import { describe, expect, it } from 'vitest';

import { needsALook } from './needs-a-look';

const rupiah = { currency: 'IDR', amount: 496_650, rate: 1.57 };

describe('needsALook', () => {
  it('passes an ordinary spend in đồng', () => {
    expect(needsALook({ amount: 45_000, foreignAmount: null })).toBe(false);
  });

  it('passes a foreign spend priced at a rate', () => {
    expect(needsALook({ amount: 780_000, foreignAmount: rupiah })).toBe(false);
  });

  it('flags a spend with no amount', () => {
    expect(needsALook({ amount: 0, foreignAmount: null })).toBe(true);
    expect(needsALook({ amount: -1, foreignAmount: null })).toBe(true);
  });

  it('flags a foreign spend with no usable rate', () => {
    expect(needsALook({ amount: 780_000, foreignAmount: { ...rupiah, rate: 0 } })).toBe(true);
    expect(needsALook({ amount: 780_000, foreignAmount: { ...rupiah, rate: Number.NaN } })).toBe(
      true,
    );
  });

  it('flags a currency that was guessed, and only then', () => {
    expect(needsALook({ amount: 780_000, foreignAmount: rupiah, currencyGuessed: true })).toBe(
      true,
    );
    expect(needsALook({ amount: 780_000, foreignAmount: rupiah, currencyGuessed: false })).toBe(
      false,
    );
  });
});
