import { describe, expect, it } from 'vitest';

import {
  ceilToFiftyThousand,
  floorToThousand,
  formatShort,
  formatVnd,
  groupDigits,
} from './format';

describe('formatVnd', () => {
  it('groups with dots and suffixes the đồng sign', () => {
    expect(formatVnd(49_000)).toBe('49.000₫');
    expect(formatVnd(17_400_000)).toBe('17.400.000₫');
    expect(formatVnd(0)).toBe('0₫');
  });

  it('uses tỷ and B for billions, with up to two decimals', () => {
    expect(formatShort(2_000_000_000, 'vi')).toBe('2 tỷ');
    expect(formatShort(2_000_000_000, 'en')).toBe('2B');
    expect(formatShort(1_250_000_000, 'vi')).toBe('1,25 tỷ');
    expect(formatShort(1_250_000_000, 'en')).toBe('1.25B');
    expect(formatShort(12_500_000_000, 'en')).toBe('12.5B');
    expect(formatShort(-1_500_000_000, 'vi')).toBe('−1,5 tỷ');
  });

  it('goes into billions only where millions would read a thousand', () => {
    expect(formatShort(995_000_000, 'vi')).toBe('995tr');
    expect(formatShort(999_940_000, 'en')).toBe('999.9M');
    expect(formatShort(999_950_000, 'en')).toBe('1B');
  });

  it('writes negatives with U+2212, never a hyphen', () => {
    expect(formatVnd(-1_250_000)).toBe('−1.250.000₫');
  });

  it('rounds stray fractions', () => {
    expect(formatVnd(25_400.6)).toBe('25.401₫');
  });
});

describe('formatShort', () => {
  it('uses tr with a comma decimal for millions in Vietnamese', () => {
    expect(formatShort(17_400_000, 'vi')).toBe('17,4tr');
    expect(formatShort(2_000_000, 'vi')).toBe('2tr');
    expect(formatShort(7_800_000, 'vi')).toBe('7,8tr');
  });

  it('uses M with a point decimal for millions in English', () => {
    expect(formatShort(17_400_000, 'en')).toBe('17.4M');
    expect(formatShort(2_000_000, 'en')).toBe('2M');
    expect(formatShort(1_400_000, 'en')).toBe('1.4M');
  });

  it('uses k below a million in both languages', () => {
    for (const language of ['en', 'vi'] as const) {
      expect(formatShort(353_000, language)).toBe('353k');
      expect(formatShort(302_000, language)).toBe('302k');
      expect(formatShort(0, language)).toBe('0k');
      expect(formatShort(-6_000, language)).toBe('−6k');
    }
  });

  it('rounds to the nearest hundred thousand once past a million', () => {
    expect(formatShort(1_000_000, 'en')).toBe('1M');
    expect(formatShort(1_000_000, 'vi')).toBe('1tr');
    expect(formatShort(1_050_000, 'en')).toBe('1.1M');
    expect(formatShort(1_050_000, 'vi')).toBe('1,1tr');
    expect(formatShort(1_949_999, 'en')).toBe('1.9M');
    expect(formatShort(1_950_000, 'vi')).toBe('2tr');
  });

  it('rounds to the nearest thousand below a million, and up into millions at the edge', () => {
    expect(formatShort(999_500, 'en')).toBe('1M');
    expect(formatShort(999_500, 'vi')).toBe('1tr');
    expect(formatShort(999_499, 'vi')).toBe('999k');
    expect(formatShort(499, 'en')).toBe('0k');
    expect(formatShort(500, 'vi')).toBe('1k');
  });

  it('writes negatives with U+2212 and drops the sign from a rounded zero', () => {
    expect(formatShort(-1_250_000, 'en')).toBe('−1.3M');
    expect(formatShort(-1_250_000, 'vi')).toBe('−1,3tr');
    expect(formatShort(-400, 'en')).toBe('0k');
    expect(formatShort(-400, 'vi')).toBe('0k');
  });
});

describe('rounding helpers', () => {
  it('floors to thousands and ceils to fifty thousands', () => {
    expect(floorToThousand(351_521)).toBe(351_000);
    expect(ceilToFiftyThousand(700_001)).toBe(750_000);
    expect(groupDigits(-1000)).toBe('1.000');
  });
});
