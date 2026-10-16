import { describe, expect, it } from 'vitest';

import { currencyOf } from '../money/currency';
import { parseBankLine } from './bank-line';

describe('parseBankLine', () => {
  it('reads the design’s bank rows as they are dragged out', () => {
    expect(parseBankLine('Circle K Lê Lợi\n17:41 · Card\n−32.000')).toEqual({
      merchant: 'Circle K Lê Lợi',
      amount: 32_000,
      categoryHint: 'shopping',
    });
    expect(parseBankLine('Bánh mì Huỳnh Hoa 12:05 · Card −45.000 Drag →')).toEqual({
      merchant: 'Bánh mì Huỳnh Hoa',
      amount: 45_000,
      categoryHint: 'food',
    });
  });

  it('prefers the amount printed with a minus over a balance beside it', () => {
    expect(parseBankLine('Phúc Long -65,000 VND · Balance 18,240,500')?.amount).toBe(65_000);
  });

  it('reads k, đồng marks and plain long numbers', () => {
    expect(parseBankLine('Grab 32k')).toMatchObject({ merchant: 'Grab', amount: 32_000 });
    expect(parseBankLine('Highlands Coffee 55.000đ')).toMatchObject({ amount: 55_000 });
    expect(parseBankLine('Xanh SM 28000')).toMatchObject({ merchant: 'Xanh SM', amount: 28_000 });
  });

  it('keeps a merchant’s own words', () => {
    expect(parseBankLine('The Coffee House · Card · −59.000')?.merchant).toBe('The Coffee House');
  });

  it('never takes a time or a date for the amount', () => {
    expect(parseBankLine('17:41 16/10')).toBeNull();
    expect(parseBankLine('Co.op Mart 16/10 17:41 −255.000')).toMatchObject({
      merchant: 'Co.op Mart',
      amount: 255_000,
    });
  });

  it('is null with no amount, and reads cents in a currency that has them', () => {
    expect(parseBankLine('Circle K Lê Lợi')).toBeNull();
    expect(parseBankLine('Starbucks -4.50', currencyOf('USD'))).toMatchObject({ amount: 450 });
  });
});
