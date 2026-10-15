import { describe, expect, it } from 'vitest';

import {
  clampNeededBy,
  latestNeededBy,
  neededByAt,
  neededByHorizon,
  neededByMonths,
  neededByYears,
  potRoom,
  soonestNeededBy,
} from './needed-by';
import { currencyOf } from '../money/currency';
import { potMonthlyNeed } from './plan-river';

describe('needed by', () => {
  it('reaches ten years past the pay cycle month', () => {
    expect(latestNeededBy('2026-10')).toBe('2036-10');
    expect(neededByYears('2026-10')).toEqual([
      2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036,
    ]);
  });

  it('holds a month between the cycle month and the reach', () => {
    expect(clampNeededBy('2026-03', '2026-10')).toBe('2026-10');
    expect(clampNeededBy('2040-01', '2026-10')).toBe('2036-10');
    expect(clampNeededBy('2028-10', '2026-10')).toBe('2028-10');
  });

  it('reads the month and year wheels, held inside the reach', () => {
    expect(neededByAt(2028, 9, '2026-10')).toBe('2028-10');
    expect(neededByAt(2026, 0, '2026-10')).toBe('2026-10');
    expect(neededByAt(2036, 11, '2026-10')).toBe('2036-10');
  });

  it('offers only the months inside the reach in the first and last year', () => {
    expect(neededByMonths(2026, '2026-10')).toEqual({ first: 9, last: 11 });
    expect(neededByMonths(2030, '2026-10')).toEqual({ first: 0, last: 11 });
    expect(neededByMonths(2036, '2026-10')).toEqual({ first: 0, last: 9 });
    expect(neededByMonths(2027, '2027-01')).toEqual({ first: 0, last: 11 });
  });

  it('says how far a month is in years and months', () => {
    expect(neededByHorizon('2026-10', '2026-10')).toEqual({ years: 0, months: 0 });
    expect(neededByHorizon('2026-10', '2027-01')).toEqual({ years: 0, months: 3 });
    expect(neededByHorizon('2026-10', '2028-10')).toEqual({ years: 2, months: 0 });
    expect(neededByHorizon('2026-10', '2029-12')).toEqual({ years: 3, months: 2 });
  });
});

describe('soonestNeededBy', () => {
  it('rounds set-asides to the home currency', () => {
    // $1,000 with $90 free: set-asides round up to $50, so twenty months.
    const input = { goal: 100_000, saved: 0, room: 9_000, from: '2026-10' };
    expect(soonestNeededBy({ ...input, currency: currencyOf('USD') })).toBe('2028-06');
    // The same numbers in đồng round up to 50.000₫, which never fits 9.000₫.
    expect(soonestNeededBy(input)).toBeNull();
  });

  it('finds the first month whose set-aside fits what the month has free', () => {
    // 2 tỷ with 10tr free a month: 200 months is past the reach.
    expect(
      soonestNeededBy({ goal: 2_000_000_000, saved: 0, room: 10_000_000, from: '2026-10' }),
    ).toBeNull();
    // 800tr with 20tr free: 40 months.
    const car = soonestNeededBy({ goal: 800_000_000, saved: 0, room: 20_000_000, from: '2026-10' });
    expect(car).toBe('2030-02');
    expect(potMonthlyNeed(800_000_000, 0, 40)).toBeLessThanOrEqual(20_000_000);
  });

  it('counts the rounding up to 50k, never landing on a month that is still too much', () => {
    // 1tr over 3 months is 333.334, rounded up to 350k: more than 340k free, so 4 months.
    expect(soonestNeededBy({ goal: 1_000_000, saved: 0, room: 340_000, from: '2026-10' })).toBe(
      '2027-02',
    );
  });

  it('is the cycle month for a full pot and null with nothing free', () => {
    expect(soonestNeededBy({ goal: 1_000_000, saved: 1_000_000, room: 0, from: '2026-10' })).toBe(
      '2026-10',
    );
    expect(soonestNeededBy({ goal: 1_000_000, saved: 0, room: 0, from: '2026-10' })).toBeNull();
  });
});

describe('potRoom', () => {
  it('is what is left after bills, Future you and the other pots, never below zero', () => {
    expect(
      potRoom({
        income: 17_400_000,
        bills: 4_200_000,
        futureYou: 2_000_000,
        otherOccasions: 750_000,
      }),
    ).toBe(10_450_000);
    expect(
      potRoom({ income: 5_000_000, bills: 4_200_000, futureYou: 2_000_000, otherOccasions: 0 }),
    ).toBe(0);
  });
});
