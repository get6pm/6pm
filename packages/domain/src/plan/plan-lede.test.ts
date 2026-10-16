import { describe, expect, it } from 'vitest';

import { replanWorded } from './daily-number';
import { planLede } from './plan-lede';

const day = (free: number, tomorrow: number) => ({ free, tomorrow, overspent: free < 0 });
const saving = { planned: 2_000_000, skipped: false };

describe('planLede', () => {
  it('gives the free money and its daily line on an ordinary day', () => {
    expect(planLede(saving, day(1_200_000, 100_000))).toEqual({
      setAside: 'futureYou',
      left: 'daily',
      over: 0,
    });
  });

  it('says how far past the plan an overspent cycle is, never a negative amount left', () => {
    expect(planLede(saving, day(-880_000, 0))).toEqual({
      setAside: 'futureYou',
      left: 'pastPlan',
      over: 880_000,
    });
  });

  it('never offers nothing a day', () => {
    expect(planLede(saving, day(0, 0)).left).toBe('allSpent');
    // The last day: free money with no day after it to share it over.
    expect(planLede(saving, day(40_000, 0)).left).toBe('untilPayday');
  });

  it('says Future you starts at payday in a cycle that skipped it', () => {
    expect(planLede({ planned: 2_000_000, skipped: true }, day(-300_000, 0))).toEqual({
      setAside: 'futureYouAtPayday',
      left: 'pastPlan',
      over: 300_000,
    });
  });

  it('names bills alone when there is no Future you', () => {
    expect(planLede({ planned: 0, skipped: true }, day(500_000, 50_000)).setAside).toBe(
      'billsOnly',
    );
    expect(planLede({ planned: 0, skipped: false }, day(500_000, 50_000)).setAside).toBe(
      'billsOnly',
    );
  });
});

describe('replanWorded', () => {
  const short = (amount: number) => `${Math.floor(amount / 1000)}k`;

  it('words a lower tomorrow', () => {
    expect(replanWorded({ tomorrow: 38_000, line: 43_000 }, short)).toBe(true);
  });

  it('stays quiet when both read the same once shortened, or tomorrow is not lower', () => {
    expect(replanWorded({ tomorrow: 43_000, line: 43_000 }, short)).toBe(false);
    expect(replanWorded({ tomorrow: 43_200, line: 43_900 }, short)).toBe(false);
    expect(replanWorded({ tomorrow: 45_000, line: 44_000 }, short)).toBe(false);
  });
});
