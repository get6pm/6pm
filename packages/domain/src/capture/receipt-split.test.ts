import { describe, expect, it } from 'vitest';

import { currencyOf, VND } from '../money/currency';
import { offersSplit, SPLIT_MOST, splitPrinted, splitShare } from './receipt-split';

const USD = currencyOf('USD');

describe('splitting a receipt', () => {
  it('is offered for a big bill only', () => {
    expect(offersSplit(2_941_000, VND)).toBe(true);
    expect(offersSplit(499_000, VND)).toBe(false);
    expect(offersSplit(null, VND)).toBe(false);
    expect(offersSplit(10_000, USD)).toBe(true);
    expect(offersSplit(500, USD)).toBe(false);
  });

  it('rounds each đồng share up to a thousand, so the shares cover the bill', () => {
    expect(splitShare(2_941_000, 4, VND)).toBe(736_000);
    expect(splitShare(2_941_000, 1, VND)).toBe(2_941_000);
    expect(splitShare(900_000, 3, VND)).toBe(300_000);
  });

  it('rounds other shares up to the cent', () => {
    expect(splitShare(10_000, 3, USD)).toBe(3_334);
  });

  it('never splits more than the most ways', () => {
    expect(splitShare(2_000_000, 100, VND)).toBe(splitShare(2_000_000, SPLIT_MOST, VND));
  });

  it('splits a printed foreign total', () => {
    expect(splitPrinted('68.80', 3)).toBe('22.94');
    expect(splitPrinted('120', 4)).toBe('30');
    expect(splitPrinted('68.80', 1)).toBe('68.80');
  });
});
