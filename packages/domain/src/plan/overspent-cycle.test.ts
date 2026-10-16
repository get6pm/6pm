import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { dailyNumber, type DailyNumberInput } from './daily-number';
import { joinedShare, payCycleOn } from './pay-cycle';
import { moneyRiver } from './plan-river';

/** 4tr free for the cycle, 22 days after today. */
const base: DailyNumberInput = {
  plan: { income: 10_000_000, bills: 4_000_000, futureYou: 2_000_000, occasions: 0, topUps: 0 },
  spentBefore: 0,
  today: [],
  notDaily: new Set(),
  daysLeft: 22,
};

describe('a cycle whose free money is gone', () => {
  it('keeps the line at zero and says the cycle is overspent, with nothing spent today', () => {
    const day = dailyNumber({ ...base, spentBefore: 4_500_000 });
    expect(day.line).toBe(0);
    expect(day.safe).toBe(0);
    expect(day.tomorrow).toBe(0);
    expect(day.free).toBe(-500_000);
    expect(day.overspent).toBe(true);
  });

  it('is overspent once a day takes the cycle past its free money, not before', () => {
    const big = { amount: 4_100_000, category: 'Shopping', status: 'kept' } as const;
    expect(dailyNumber({ ...base, today: [big] }).overspent).toBe(true);
    expect(dailyNumber({ ...base, today: [{ ...big, amount: 400_000 }] }).overspent).toBe(false);
  });

  it('never says the month still lands on the day the cycle goes past its plan', () => {
    const big = { amount: 4_100_000, category: 'Shopping', status: 'kept' } as const;
    const tipped = dailyNumber({ ...base, today: [big] });
    expect(tipped.tomorrow).toBeLessThan(tipped.line);
    expect(tipped.overspent).toBe(true);
    expect(tipped.replan).toBe(false);
    // A big day the cycle still covers keeps its replan.
    expect(dailyNumber({ ...base, today: [{ ...big, amount: 400_000 }] }).replan).toBe(true);
  });

  it('never gives a negative line, Infinity or NaN, whatever the days or share', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -20_000_000, max: 20_000_000 }),
        fc.integer({ min: 0, max: 30_000_000 }),
        fc.oneof(fc.integer({ min: -5, max: 31 }), fc.constant(Number.NaN)),
        fc.oneof(fc.double({ min: -2, max: 3, noNaN: true }), fc.constant(Number.NaN)),
        (planned, spentBefore, daysLeft, share) => {
          const day = dailyNumber({
            ...base,
            plan: { ...base.plan, income: base.plan.bills + base.plan.futureYou + planned },
            spentBefore,
            daysLeft,
            share,
          });
          for (const value of [day.startFree, day.line, day.free, day.safe, day.tomorrow]) {
            expect(Number.isFinite(value)).toBe(true);
          }
          expect(day.line).toBeGreaterThanOrEqual(0);
          expect(day.overspent).toBe(day.free < 0);
          if (day.overspent) expect(day.replan).toBe(false);
        },
      ),
    );
  });
});

describe('the joined cycle when bills take more than the income', () => {
  const cycle = payCycleOn('2026-10-10', { kind: 'sameDay', day: 25 });
  const share = joinedShare(cycle, '2026-10-10');
  const plan = { income: 5_000_000, bills: 6_000_000, futureYou: 0, occasions: 0, topUps: 0 };

  it('counts the whole shortfall, never a scaled part of it', () => {
    const day = dailyNumber({ ...base, plan, daysLeft: cycle.daysLeft, share });
    expect(day.startFree).toBe(-1_000_000);
    expect(day.overspent).toBe(true);
  });

  it('shows no negative spent in the money river', () => {
    const spend = { amount: 200_000, category: 'Food', status: 'kept' } as const;
    const day = dailyNumber({ ...base, plan, today: [spend], daysLeft: cycle.daysLeft, share });
    const river = moneyRiver({
      income: plan.income,
      bills: plan.bills,
      futureYou: 0,
      occasions: 0,
      goalTopUps: 0,
      occasionTopUps: 0,
      free: day.free,
      share,
    });
    expect(river.before).toBe(0);
    expect(river.spent).toBe(200_000);
  });
});
