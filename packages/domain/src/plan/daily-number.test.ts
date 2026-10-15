import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { CountedSpend } from '../spend/spend';
import { currencyOf } from '../money/currency';
import { dailyNumber, lineUsed, type MonthPlan } from './daily-number';
import { payCycleOn } from './pay-cycle';

/** The prototype's Friday 9 October: payday 31 Oct, 2.365.000₫ spent 1–8 Oct. */
const plan: MonthPlan = {
  income: 17_400_000,
  bills: 4_200_000,
  futureYou: 2_000_000,
  occasions: 750_000,
  topUps: 0,
};

const friday: CountedSpend[] = [
  { amount: 25_000, category: 'Food', status: 'kept' },
  { amount: 29_000, category: 'Drinks', status: 'caught' },
  { amount: 45_000, category: 'Food', status: 'pending' },
  { amount: 38_000, category: 'Transport', status: 'caught' },
  { amount: 45_000, category: 'Drinks', status: 'kept' },
  { amount: 120_000, category: 'Shopping', status: 'caught' },
];

const daysLeft = payCycleOn('2026-10-09', { kind: 'sameDay', day: 31 }).daysLeft;

describe('dailyNumber', () => {
  it('reproduces the designed Friday: 49.000 safe, 351k line, 353k tomorrow', () => {
    const day = dailyNumber({
      plan,
      spentBefore: 2_365_000,
      today: friday,
      notDaily: new Set(),
      daysLeft,
    });
    expect(daysLeft).toBe(22);
    expect(day.startFree).toBe(8_085_000);
    expect(day.line).toBe(351_000);
    expect(day.spent).toBe(302_000);
    expect(day.safe).toBe(49_000);
    expect(day.tomorrow).toBe(353_000);
    expect(day.replan).toBe(false);
  });

  it('replans after a big day: the 450k gift drops tomorrow below today', () => {
    const day = dailyNumber({
      plan,
      spentBefore: 2_365_000,
      today: [...friday, { amount: 450_000, category: 'Gifts', status: 'caught' }],
      notDaily: new Set(),
      daysLeft,
    });
    expect(day.safe).toBe(-401_000);
    expect(day.tomorrow).toBe(333_000);
    expect(day.replan).toBe(true);
  });

  it('leaves out skipped, deleted, work and not-daily spends', () => {
    const day = dailyNumber({
      plan,
      spentBefore: 0,
      today: [
        { amount: 100_000, category: 'Food', status: 'skipped' },
        { amount: 100_000, category: 'Food', status: 'deleted' },
        { amount: 100_000, category: 'Food', status: 'kept', forWork: true },
        { amount: 100_000, category: 'Rent', status: 'kept' },
        { amount: 10_000, category: 'Food', status: 'kept' },
      ],
      notDaily: new Set(['Rent']),
      daysLeft,
    });
    expect(day.spent).toBe(10_000);
  });

  it('never promises more than the free money', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200_000_000 }),
        fc.integer({ min: 0, max: 50_000_000 }),
        fc.integer({ min: 1, max: 31 }),
        (income, spentBefore, days) => {
          const day = dailyNumber({
            plan: { income, bills: 0, futureYou: 0, occasions: 0, topUps: 0 },
            spentBefore,
            today: [],
            notDaily: new Set(),
            daysLeft: days,
          });
          expect(day.line * (days + 1)).toBeLessThanOrEqual(Math.max(0, day.startFree) + 0);
          expect(day.tomorrow * days).toBeLessThanOrEqual(Math.max(0, day.free));
        },
      ),
    );
  });

  it('meters the used share of the line', () => {
    const day = dailyNumber({
      plan,
      spentBefore: 2_365_000,
      today: friday,
      notDaily: new Set(),
      daysLeft,
    });
    expect(lineUsed(day)).toBeCloseTo(302 / 351, 5);
  });
});

describe('payCycleOn', () => {
  it('counts the days after today through payday', () => {
    expect(payCycleOn('2026-10-09', { kind: 'sameDay', day: 31 })).toEqual({
      start: '2026-09-30',
      payday: '2026-10-31',
      daysLeft: 22,
    });
  });

  it('starts a new cycle on payday itself', () => {
    expect(payCycleOn('2026-10-25', { kind: 'sameDay', day: 25 })).toEqual({
      start: '2026-10-25',
      payday: '2026-11-25',
      daysLeft: 31,
    });
  });

  it('clamps the 31st to short months and handles the last day', () => {
    expect(payCycleOn('2026-11-10', { kind: 'sameDay', day: 31 }).payday).toBe('2026-11-30');
    expect(payCycleOn('2027-02-01', { kind: 'lastDay' }).payday).toBe('2027-02-28');
    expect(payCycleOn('2026-12-31', { kind: 'lastDay' }).payday).toBe('2027-01-31');
  });
});

describe('dailyNumber in dollars', () => {
  it('floors the line and tomorrow to whole dollars, in cents', () => {
    const day = dailyNumber({
      plan: { income: 500_000, bills: 180_000, futureYou: 50_000, occasions: 0, topUps: 0 },
      spentBefore: 0,
      today: [{ amount: 1_250, category: 'Food', status: 'kept' }],
      notDaily: new Set(),
      daysLeft: 29,
      currency: currencyOf('USD'),
    });
    // $2,700 over 30 days is $90 a day; $2,687.50 over the 29 left is $92.67, floored to $92.
    expect(day.line).toBe(9_000);
    expect(day.safe).toBe(7_750);
    expect(day.tomorrow).toBe(9_200);
  });
});
