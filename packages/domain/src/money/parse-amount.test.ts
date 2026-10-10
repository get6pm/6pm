import { describe, expect, it } from 'vitest';

import { parseAmount } from './parse-amount';

describe('parseAmount', () => {
  it.each([
    ['45k', 45_000],
    ['45 k', 45_000],
    ['45 nghìn', 45_000],
    ['45 ngàn', 45_000],
    ['45.000', 45_000],
    ['45.000₫', 45_000],
    ['1.250.000đ', 1_250_000],
    ['35', 35_000],
    ['trà sữa 45k', 45_000],
    ['1tr2', 1_200_000],
    ['1tr25', 1_250_000],
    ['1,5tr', 1_500_000],
    ['2tr', 2_000_000],
    ['2 triệu', 2_000_000],
    ['2 triệu rưỡi', 2_500_000],
    ['45 nghìn rưỡi', 45_500],
    ['Can I afford a 2tr dinner Saturday?', 2_000_000],
    ['What if I buy a 450k jacket?', 450_000],
    ['1 củ', 1_000_000],
  ])('%s → %d', (text, expected) => {
    expect(parseAmount(text)).toBe(expected);
  });

  it('does not read a dish as a unit', () => {
    expect(parseAmount('45 mì')).toBe(45_000);
    expect(parseAmount('2 mins')).toBe(2_000);
  });

  it('returns null when there is no number', () => {
    expect(parseAmount('phở with extra beef')).toBeNull();
  });
});
