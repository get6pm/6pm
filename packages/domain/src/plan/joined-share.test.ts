import { describe, expect, it } from 'vitest';

import { dailyNumber } from './daily-number';
import { joinedShare, payCycleOn } from './pay-cycle';

const payday25 = { kind: 'sameDay', day: 25 } as const;

describe('joinedShare', () => {
  it('counts the days left in the cycle the user joined, payday included', () => {
    // 25 Sep → 25 Oct is 31 days; joining on 10 Oct leaves 16 of them.
    const cycle = payCycleOn('2026-10-10', payday25);
    expect(joinedShare(cycle, '2026-10-10')).toBeCloseTo(16 / 31);
  });

  it('gives the whole cycle when the user joined on or before it began', () => {
    const cycle = payCycleOn('2026-11-02', payday25);
    expect(joinedShare(cycle, '2026-10-10')).toBe(1);
    expect(joinedShare(cycle, cycle.start)).toBe(1);
  });

  it('gives the whole cycle when the joining day is unknown', () => {
    expect(joinedShare(payCycleOn('2026-10-10', payday25), null)).toBe(1);
  });
});

describe('first number when joining mid-cycle', () => {
  it('spreads only the unspent share of the free money: 15,5tr pay, 12% Future you, 10 Oct', () => {
    const cycle = payCycleOn('2026-10-10', payday25);
    const day = dailyNumber({
      plan: { income: 15_500_000, bills: 0, futureYou: 1_900_000, occasions: 0, topUps: 0 },
      spentBefore: 0,
      today: [],
      notDaily: new Set(),
      daysLeft: cycle.daysLeft,
      share: joinedShare(cycle, '2026-10-10'),
    });
    // 13,6tr × 16/31 = 7.019.355₫ over 16 days.
    expect(day.startFree).toBe(7_019_355);
    expect(day.line).toBe(438_000);
  });
});
