import { describe, expect, it } from 'vitest';

import { needsALook } from './needs-a-look';

const rupiah = { currency: 'IDR', amount: 496_650, rate: 1.6 };

describe('needsALook', () => {
  it('is quiet for a spend read and priced surely', () => {
    expect(needsALook({ amount: 101_500, foreignAmount: null })).toBe(false);
    expect(needsALook({ amount: 794_640, foreignAmount: rupiah, currencyGuessed: false })).toBe(
      false,
    );
  });

  it('asks about an amount that was never read or priced', () => {
    expect(needsALook({ amount: 0, foreignAmount: null })).toBe(true);
    expect(needsALook({ amount: Number.NaN, foreignAmount: null })).toBe(true);
  });

  it('asks about a foreign amount still waiting for its rate', () => {
    expect(needsALook({ amount: 0, foreignAmount: { ...rupiah, rate: 0 } })).toBe(true);
    expect(needsALook({ amount: 794_640, foreignAmount: { ...rupiah, rate: 0 } })).toBe(true);
  });

  it('asks about a currency that was guessed', () => {
    expect(needsALook({ amount: 368_160, foreignAmount: null, currencyGuessed: true })).toBe(true);
    expect(needsALook({ amount: 589_056, foreignAmount: rupiah, currencyGuessed: true })).toBe(
      true,
    );
  });
});
