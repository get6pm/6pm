import { describe, expect, it } from 'vitest';

import { dailyNumber } from './daily-number';
import { payCycleOn } from './pay-cycle';
import {
  aboutPerDay,
  addMonthsTo,
  billDueIn,
  cyclePosition,
  dayBarFraction,
  dayBarScale,
  goalMonthly,
  goalPlan,
  moneyRiver,
  monthsUntil,
  potMonthlyNeed,
  whatIfDaily,
} from './plan-river';

/** The prototype's Friday 9 October, payday 31 Oct: 302k spent today, 2.365tr before. */
const today = '2026-10-09';
const cycle = payCycleOn(today, { kind: 'sameDay', day: 31 });
const day = dailyNumber({
  plan: {
    income: 17_400_000,
    bills: 4_200_000,
    futureYou: 2_000_000,
    occasions: 750_000,
    topUps: 0,
  },
  spentBefore: 2_365_000,
  today: [{ amount: 302_000, category: 'Food', status: 'kept' }],
  notDaily: new Set(),
  daysLeft: cycle.daysLeft,
});

describe('moneyRiver', () => {
  it('splits the designed 17,4tr into the five segments', () => {
    const river = moneyRiver({
      income: 17_400_000,
      bills: 4_200_000,
      futureYou: 2_000_000,
      occasions: 750_000,
      goalTopUps: 0,
      occasionTopUps: 0,
      free: day.free,
    });
    expect(day.free).toBe(7_783_000);
    expect(river).toEqual({
      bills: 4_200_000,
      futureYou: 2_000_000,
      occasions: 750_000,
      spent: 2_667_000,
      free: 7_783_000,
    });
  });

  it('adds top-ups to their own segment and keeps the total at the income', () => {
    const river = moneyRiver({
      income: 17_400_000,
      bills: 4_200_000,
      futureYou: 2_000_000,
      occasions: 750_000,
      goalTopUps: 100_000,
      occasionTopUps: 200_000,
      free: day.free - 300_000,
    });
    expect(river.futureYou).toBe(2_100_000);
    expect(river.occasions).toBe(950_000);
    expect(river.spent).toBe(2_667_000);
    expect(Object.values(river).reduce((a, b) => a + b, 0)).toBe(17_400_000);
  });
});

describe('what-if', () => {
  it('keeps 353k a day at the planned 2tr and shows the real change off it', () => {
    expect(cycle.daysLeft).toBe(22);
    expect(whatIfDaily(day.free, 2_000_000, 2_000_000, 22)).toBe(day.tomorrow);
    expect(day.tomorrow).toBe(353_000);
    expect(whatIfDaily(day.free, 2_000_000, 1_500_000, 22)).toBe(376_000);
    expect(whatIfDaily(day.free, 2_000_000, 2_500_000, 22)).toBe(331_000);
    expect(whatIfDaily(day.free, 2_000_000, 0, 22)).toBe(444_000);
  });

  it('is the same before and after the new amount is committed', () => {
    const committedFree = day.free + 2_000_000 - 1_500_000;
    expect(whatIfDaily(committedFree, 1_500_000, 2_000_000, 22)).toBe(353_000);
  });

  it('never goes below zero and is zero on payday', () => {
    expect(whatIfDaily(100_000, 0, 4_000_000, 22)).toBe(0);
    expect(whatIfDaily(day.free, 2_000_000, 2_000_000, 0)).toBe(0);
  });

  it('says each extra 100k costs about 5k a day', () => {
    expect(aboutPerDay(100_000, 22)).toBe(5_000);
    expect(aboutPerDay(700_000, 30)).toBe(23_000);
  });
});

describe('day bars', () => {
  it('draws 353k at 59% of the row, as designed', () => {
    const scale = dayBarScale(day.free, 2_000_000, 22);
    expect(scale).toBe(600_000);
    expect(dayBarFraction(353_000, scale)).toBe(0.59);
    expect(dayBarFraction(0, scale)).toBe(0.08);
    expect(dayBarFraction(900_000, scale)).toBe(1);
  });

  it('grows the scale for a bigger month so the bars still move', () => {
    expect(dayBarScale(30_000_000, 0, 22)).toBe(1_363_000);
  });
});

describe('pots and goals', () => {
  it('sets 450k a month aside for Tết: 1,8tr left over four months', () => {
    expect(monthsUntil(today, '2027-02')).toBe(4);
    expect(potMonthlyNeed(3_000_000, 1_200_000, 4)).toBe(450_000);
  });

  it('rounds a new 2tr pot for January up to 700k a month', () => {
    expect(potMonthlyNeed(2_000_000, 0, monthsUntil(today, '2027-01'))).toBe(700_000);
    expect(potMonthlyNeed(4_000_000, 0, 3)).toBe(1_350_000);
  });

  it('needs nothing once full or without a date', () => {
    expect(potMonthlyNeed(500_000, 500_000, 1)).toBe(0);
    expect(potMonthlyNeed(4_000_000, 0, null)).toBe(0);
    expect(monthsUntil(today, '2026-10')).toBe(1);
  });

  it('puts Japan on track for March and the cushion at 800k a month', () => {
    const japan = goalPlan({
      goal: 6_000_000,
      saved: 3_600_000,
      monthly: goalMonthly(2_000_000, 0.6),
      neededBy: '2027-03',
      today,
    });
    expect(japan).toEqual({ status: 'onTrack', eta: '2026-12', monthly: 1_200_000 });
    const cushion = goalPlan({
      goal: 15_000_000,
      saved: 5_000_000,
      monthly: goalMonthly(2_000_000, 0.4),
      neededBy: null,
      today,
    });
    expect(cushion).toEqual({ status: 'steady', eta: '2027-11', monthly: 800_000 });
  });

  it('is behind when the pace misses the date, paused at zero, reached when full', () => {
    const base = { goal: 6_000_000, saved: 3_600_000, neededBy: '2026-11', today };
    expect(goalPlan({ ...base, monthly: 1_200_000 }).status).toBe('behind');
    expect(goalPlan({ ...base, monthly: 0 }).status).toBe('paused');
    expect(goalPlan({ ...base, saved: 6_000_000, monthly: 0 }).status).toBe('reached');
  });

  it('moves months across years', () => {
    expect(addMonthsTo('2026-10', 13)).toBe('2027-11');
    expect(addMonthsTo('2026-01', -1)).toBe('2025-12');
  });
});

describe('bills on the cycle line', () => {
  it('places the designed October: rent on the 1st, today at 26,7%, payday at the end', () => {
    expect(billDueIn(cycle, 1)).toBe('2026-10-01');
    expect(billDueIn(cycle, 31)).toBe('2026-10-31');
    expect(cyclePosition(cycle, '2026-10-01')).toBe(0);
    expect(cyclePosition(cycle, today)).toBeCloseTo(8 / 30);
    expect(cyclePosition(cycle, '2026-10-12')).toBeCloseTo(11 / 30);
    expect(cyclePosition(cycle, cycle.payday)).toBe(1);
  });

  it('finds a bill in a cycle that spans two months', () => {
    const mid = payCycleOn('2026-10-09', { kind: 'sameDay', day: 25 });
    expect(billDueIn(mid, 28)).toBe('2026-09-28');
    expect(billDueIn(mid, 3)).toBe('2026-10-03');
    expect(billDueIn(mid, 25)).toBe('2026-10-25');
  });
});
