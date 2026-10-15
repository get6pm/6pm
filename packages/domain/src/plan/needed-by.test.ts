import { describe, expect, it } from 'vitest';

import {
  clampNeededBy,
  latestNeededBy,
  NEEDED_BY_SPANS,
  neededByFromOffset,
  neededByHorizon,
  neededByMarks,
  neededByOffset,
  neededByStep,
  potFit,
  potRoom,
  soonestNeededBy,
} from './needed-by';
import { currencyOf } from '../money/currency';
import { potMonthlyNeed } from './plan-river';

describe('needed by', () => {
  it('reaches ten years past the pay cycle month', () => {
    expect(latestNeededBy('2026-10')).toBe('2036-10');
    expect(neededByOffset('2026-10', '2036-10')).toBe(120);
  });

  it('holds a month between the cycle month and the reach', () => {
    expect(clampNeededBy('2026-03', '2026-10')).toBe('2026-10');
    expect(clampNeededBy('2040-01', '2026-10')).toBe('2036-10');
    expect(clampNeededBy('2028-10', '2026-10')).toBe('2028-10');
  });

  it('places a month on the timeline and reads one back, held inside the reach', () => {
    expect(neededByOffset('2026-10', '2028-10')).toBe(24);
    expect(neededByOffset('2026-10', '2026-03')).toBe(0);
    expect(neededByOffset('2026-10', '2040-01')).toBe(120);
    expect(neededByFromOffset('2026-10', 23.6)).toBe('2028-10');
    expect(neededByFromOffset('2026-10', -4)).toBe('2026-10');
    expect(neededByFromOffset('2026-10', 130)).toBe('2036-10');
  });

  it('steps one month at a time, never past either end', () => {
    expect(neededByStep('2028-10', '2026-10', 1)).toBe('2028-11');
    expect(neededByStep('2028-01', '2026-10', -1)).toBe('2027-12');
    expect(neededByStep('2026-10', '2026-10', -1)).toBe('2026-10');
    expect(neededByStep('2036-10', '2026-10', 1)).toBe('2036-10');
  });

  it('marks every second year under the timeline and picks whole years', () => {
    expect(neededByMarks('2026-10')).toEqual([2026, 2028, 2030, 2032, 2034, 2036]);
    expect(NEEDED_BY_SPANS).toEqual([12, 24, 60, 120]);
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

describe('potFit', () => {
  it('fits when the set-aside is no more than the month has free', () => {
    expect(potFit(21_400_000, 22_000_000)).toEqual({
      fits: true,
      left: 600_000,
      share: 21_400_000 / 22_000_000,
    });
    expect(potFit(22_000_000, 22_000_000)).toEqual({ fits: true, left: 0, share: 1 });
  });

  it('is too much past what is free, and full with nothing free', () => {
    expect(potFit(85_000_000, 22_000_000)).toEqual({ fits: false, left: 0, share: 1 });
    expect(potFit(50_000, 0)).toEqual({ fits: false, left: 0, share: 1 });
    expect(potFit(0, 0)).toEqual({ fits: true, left: 0, share: 0 });
  });
});
