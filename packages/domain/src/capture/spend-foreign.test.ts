import { describe, expect, it } from 'vitest';

import { foreignAmountText } from './spend-foreign';

describe('foreignAmountText', () => {
  it('writes whole-unit currencies with dot thousands', () => {
    expect(foreignAmountText({ currency: 'IDR', amount: 496_650 })).toBe('Rp496.650');
  });

  it('keeps cents with a comma', () => {
    expect(foreignAmountText({ currency: 'SGD', amount: 68.8 })).toBe('S$68,80');
    expect(foreignAmountText({ currency: 'THB', amount: 120 })).toBe('฿120');
  });

  it('falls back to the code for a currency without a symbol', () => {
    expect(foreignAmountText({ currency: 'CHF', amount: 68.8 })).toBe('68.80 CHF');
  });

  it('shows nothing spent as zero', () => {
    expect(foreignAmountText({ currency: 'IDR', amount: 0 })).toBe('Rp0');
  });
});
