import { describe, expect, it } from 'vitest';

import { MONEY_DAY_HOURS, daysIn, instantOnMoneyDay, movedTo, spendDayRange } from './spend-when';

const payday = { kind: 'lastDay' } as const;
const cycle = { today: '2026-10-15', cycleStart: '2026-09-30', payday };

describe('spendDayRange', () => {
  it('lets a spend in this cycle move from its first day to today', () => {
    expect(spendDayRange('2026-10-02', cycle)).toEqual({ from: '2026-09-30', to: '2026-10-15' });
  });

  it('keeps a spend from an earlier cycle in that cycle', () => {
    expect(spendDayRange('2026-09-02', cycle)).toEqual({ from: '2026-08-31', to: '2026-09-29' });
  });

  it('always holds the day the spend is on', () => {
    const odd = spendDayRange('2026-08-30', cycle);
    expect(odd.from <= '2026-08-30' && odd.to >= '2026-08-30').toBe(true);
  });
});

describe('daysIn', () => {
  it('lists every day, both ends included', () => {
    expect(daysIn({ from: '2026-09-29', to: '2026-10-01' })).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ]);
  });
});

describe('the money day clock', () => {
  const now = new Date(2026, 9, 15, 20, 0);

  it('runs from 04 to 03', () => {
    expect(MONEY_DAY_HOURS[0]).toBe(4);
    expect(MONEY_DAY_HOURS.at(-1)).toBe(3);
    expect(new Set(MONEY_DAY_HOURS).size).toBe(24);
  });

  it('puts the small hours on the next calendar day, in the same money day', () => {
    const late = instantOnMoneyDay('2026-10-13', 1, 30, now);
    expect(late).toEqual(new Date(2026, 9, 14, 1, 30));
    expect(movedTo(late).day).toBe('2026-10-13');
  });

  it('never goes past now', () => {
    expect(instantOnMoneyDay('2026-10-15', 22, 0, now)).toBe(now);
    expect(instantOnMoneyDay('2026-10-15', 8, 15, now)).toEqual(new Date(2026, 9, 15, 8, 15));
  });
});
