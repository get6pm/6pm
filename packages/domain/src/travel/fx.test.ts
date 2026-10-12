import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { TRAVEL_CURRENCIES } from './currencies';
import {
  foreignToVnd,
  formatForeign,
  formatForeignWhole,
  formatTypedForeign,
  isRate,
  vndToForeignMinor,
  vndToForeignWhole,
} from './fx';

const THB = TRAVEL_CURRENCIES['THB']!;
const JPY = TRAVEL_CURRENCIES['JPY']!;
const SGD = TRAVEL_CURRENCIES['SGD']!;

describe('a foreign amount in đồng', () => {
  it('multiplies exactly and rounds once, to the nearest đồng', () => {
    expect(foreignToVnd('120', '770.17')).toBe(92_420);
    expect(foreignToVnd('12.5', '770.17')).toBe(9_627);
    expect(foreignToVnd('3.50', '25853')).toBe(90_486);
    expect(foreignToVnd('1000', '163.22')).toBe(163_220);
  });

  it('rounds a half đồng away from zero', () => {
    // 0.5 × 3 = 1.5 → 2; 0.5 × 1 = 0.5 → 1.
    expect(foreignToVnd('0.5', '3')).toBe(2);
    expect(foreignToVnd('0.5', '1')).toBe(1);
    expect(foreignToVnd('0.25', '1')).toBe(0);
  });

  it('keeps precision a float would lose', () => {
    // 0.1 × 3 in floats is 0.30000000000000004; × 10^15 it would round wrong.
    expect(foreignToVnd('0.1', '3')).toBe(0);
    expect(foreignToVnd('1.005', '1000')).toBe(1_005);
    expect(foreignToVnd('2.675', '100')).toBe(268);
  });

  it('refuses what is not an exact decimal, and a zero rate', () => {
    expect(foreignToVnd('1e3', '770')).toBeNull();
    expect(foreignToVnd('-5', '770')).toBeNull();
    expect(foreignToVnd('5', '0')).toBeNull();
    expect(foreignToVnd('5', '0.000')).toBeNull();
    expect(foreignToVnd('5', '')).toBeNull();
    expect(isRate('770.17')).toBe(true);
    expect(isRate('0')).toBe(false);
    expect(isRate('6.9e-05')).toBe(false);
  });

  it('is never more than half a đồng from the exact product', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 1, max: 100_000_000 }),
        (cents, rateMilli) => {
          const amount = (cents / 100).toFixed(2);
          const rate = (rateMilli / 1000).toFixed(3);
          const vnd = foreignToVnd(amount, rate);
          // The exact product is cents × rateMilli / 100.000; compared in those units, in integers.
          expect(vnd).not.toBeNull();
          expect(Math.abs((vnd ?? 0) * 100_000 - cents * rateMilli)).toBeLessThanOrEqual(50_000);
        },
      ),
    );
  });
});

describe('đồng in a foreign currency', () => {
  it('gives minor units, rounded or floored', () => {
    expect(vndToForeignMinor(92_420, THB, '770.17')).toBe(12_000);
    expect(vndToForeignMinor(100_000, THB, '770.17')).toBe(12_984);
    expect(vndToForeignMinor(100_000, THB, '770.17', 'floor')).toBe(12_984);
    expect(vndToForeignMinor(100_000, JPY, '163.22')).toBe(613);
    expect(vndToForeignMinor(100_000, JPY, '163.22', 'floor')).toBe(612);
  });

  it('floors a negative remainder toward more over, never less', () => {
    expect(vndToForeignWhole(-1_000, '770.17', 'floor')).toBe(-2);
    expect(vndToForeignWhole(-1_000, '770.17', 'round')).toBe(-1);
  });

  it('refuses an unusable rate', () => {
    expect(vndToForeignWhole(1_000, '0')).toBeNull();
    expect(vndToForeignWhole(1.5, '770')).toBeNull();
  });
});

describe('writing a foreign amount', () => {
  it('groups with dots and writes decimals after a comma, only when there are any', () => {
    expect(formatForeign(120_000, THB)).toBe('฿1.200');
    expect(formatForeign(1_250, SGD)).toBe('S$12,50');
    expect(formatForeign(1_205, SGD)).toBe('S$12,05');
    expect(formatForeign(1_500_000, JPY)).toBe('¥1.500.000');
    expect(formatForeign(-8_000, THB)).toBe('−฿80');
    expect(formatForeignWhole(640, THB)).toBe('฿640');
  });

  it('shows typed digits as they are, with the comma', () => {
    expect(formatTypedForeign('', THB)).toBe('฿0');
    expect(formatTypedForeign('1200', THB)).toBe('฿1.200');
    expect(formatTypedForeign('12.', THB)).toBe('฿12,');
    expect(formatTypedForeign('12.5', THB)).toBe('฿12,5');
  });
});
