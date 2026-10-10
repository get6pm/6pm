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

  it('writes negatives with U+2212, never a hyphen', () => {
    expect(formatVnd(-1_250_000)).toBe('−1.250.000₫');
  });

  it('rounds stray fractions', () => {
    expect(formatVnd(25_400.6)).toBe('25.401₫');
  });
});

describe('formatShort', () => {
  it('uses tr with a comma decimal for millions', () => {
    expect(formatShort(17_400_000)).toBe('17,4tr');
    expect(formatShort(2_000_000)).toBe('2tr');
    expect(formatShort(7_800_000)).toBe('7,8tr');
  });

  it('uses k below a million', () => {
    expect(formatShort(353_000)).toBe('353k');
    expect(formatShort(302_000)).toBe('302k');
    expect(formatShort(0)).toBe('0k');
    expect(formatShort(-6_000)).toBe('−6k');
  });
});

describe('rounding helpers', () => {
  it('floors to thousands and ceils to fifty thousands', () => {
    expect(floorToThousand(351_521)).toBe(351_000);
    expect(ceilToFiftyThousand(700_001)).toBe(750_000);
    expect(groupDigits(-1000)).toBe('1.000');
  });
});
