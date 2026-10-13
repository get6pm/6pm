import { describe, expect, it } from 'vitest';

import { addContributionRequestSchema, sharedPotFieldsSchema } from '../contracts/together';
import { payCycleOn } from '../plan/pay-cycle';
import {
  isSharedAmount,
  MAX_SHARED_AMOUNT,
  sharedPotMonthly,
  sharedPotProgress,
  sharedTopUp,
} from './shared-pots';

describe('sharedPotProgress', () => {
  it('adds both partners up and keeps each one apart', () => {
    const p = sharedPotProgress(
      3_000_000,
      [
        { memberId: 'an', amount: 500_000 },
        { memberId: 'binh', amount: 200_000 },
        { memberId: 'an', amount: 100_000 },
      ],
      ['an', 'binh'],
    );
    expect(p.saved).toBe(800_000);
    expect(p.byMember).toEqual({ an: 600_000, binh: 200_000 });
    expect(p.left).toBe(2_200_000);
    expect(p.progress).toBeCloseTo(800_000 / 3_000_000);
    expect(p.full).toBe(false);
  });

  it('lists a partner who has added nothing with zero', () => {
    expect(sharedPotProgress(1_000_000, [], ['an', 'binh']).byMember).toEqual({ an: 0, binh: 0 });
  });

  it('keeps money from someone no longer listed in the total', () => {
    const p = sharedPotProgress(1_000_000, [{ memberId: 'gone', amount: 300_000 }], ['an']);
    expect(p.saved).toBe(300_000);
    expect(p.byMember['gone']).toBe(300_000);
  });

  it('is full at the goal and never past one', () => {
    const p = sharedPotProgress(1_000_000, [{ memberId: 'an', amount: 1_200_000 }]);
    expect(p).toMatchObject({ left: 0, progress: 1, full: true });
  });
});

describe('sharedTopUp', () => {
  it('adds the step, or only what is left', () => {
    expect(sharedTopUp(1_000_000, 0, 100_000)).toBe(100_000);
    expect(sharedTopUp(1_000_000, 950_000, 100_000)).toBe(50_000);
    expect(sharedTopUp(1_000_000, 1_000_000, 100_000)).toBe(0);
    expect(sharedTopUp(1_000_000, 1_300_000, 100_000)).toBe(0);
  });
});

describe('sharedPotMonthly', () => {
  const cycle = payCycleOn('2026-10-13', { kind: 'lastDay' });

  it('spreads what is left over the months to the date, rounded up to 50k', () => {
    // October's cycle to December: two months, 2.2tr left → 1.1tr.
    expect(sharedPotMonthly(3_000_000, 800_000, '2026-12', cycle)).toBe(1_100_000);
    // To January: three months, 2tr left → 666.667₫ → 700k.
    expect(sharedPotMonthly(3_000_000, 1_000_000, '2027-01', cycle)).toBe(700_000);
  });

  it('asks nothing without a date, once the month has gone, or when full', () => {
    expect(sharedPotMonthly(3_000_000, 0, null, cycle)).toBe(0);
    expect(sharedPotMonthly(3_000_000, 0, '2026-08', cycle)).toBe(0);
    expect(sharedPotMonthly(3_000_000, 3_000_000, '2026-12', cycle)).toBe(0);
  });
});

describe('amounts', () => {
  it('takes whole positive đồng within the cap only', () => {
    expect(isSharedAmount(100_000)).toBe(true);
    expect(isSharedAmount(MAX_SHARED_AMOUNT)).toBe(true);
    for (const bad of [0, -1, 1.5, Number.NaN, Infinity, MAX_SHARED_AMOUNT + 1]) {
      expect(isSharedAmount(bad)).toBe(false);
    }
  });

  it('refuses a fractional, negative or huge amount on the wire', () => {
    const id = '0b6f0c2e-6a8d-4f8e-9c1b-2f3a4b5c6d7e';
    expect(addContributionRequestSchema.safeParse({ id, amount: 50_000 }).success).toBe(true);
    for (const amount of [0, -100, 1000.5, '1000', MAX_SHARED_AMOUNT + 1]) {
      expect(addContributionRequestSchema.safeParse({ id, amount }).success).toBe(false);
    }
  });

  it('refuses a pot with no name, a bad month or extra fields', () => {
    const pot = { name: 'Đà Lạt', icon: 'flight', hue: 85, goal: 3_000_000, neededBy: '2026-12' };
    expect(sharedPotFieldsSchema.safeParse(pot).success).toBe(true);
    expect(sharedPotFieldsSchema.safeParse({ ...pot, name: '  ' }).success).toBe(false);
    expect(sharedPotFieldsSchema.safeParse({ ...pot, neededBy: '2026-13' }).success).toBe(false);
    expect(sharedPotFieldsSchema.safeParse({ ...pot, extra: 1 }).success).toBe(false);
  });
});
