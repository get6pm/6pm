import { describe, expect, it } from 'vitest';

import {
  addContributionRequestSchema,
  createSharedPotRequestSchema,
  editSharedPotRequestSchema,
  sharedPotFieldsSchema,
  sharedPotSchema,
} from '../contracts/together';
import { currencyOf } from '../money/currency';
import { payCycleOn } from '../plan/pay-cycle';
import { sharedInHome } from './shared-in-home';
import {
  isSharedAmount,
  MAX_SHARED_AMOUNT,
  minStepAmount,
  startStepAmount,
  sharedPotMonthly,
  sharedPotProgress,
  sharedTopUp,
  stepContribution,
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

describe('stepContribution', () => {
  it('steps finer for small amounts and coarser for large ones', () => {
    expect(stepContribution(100_000, 1)).toBe(150_000);
    expect(stepContribution(1_000_000, 1)).toBe(1_100_000);
    expect(stepContribution(1_000_000, -1)).toBe(950_000);
    expect(stepContribution(5_000_000, 1)).toBe(5_500_000);
    expect(stepContribution(5_000_000, -1)).toBe(4_900_000);
  });

  it('never goes below 50k or past the cap', () => {
    expect(stepContribution(50_000, -1)).toBe(50_000);
    expect(stepContribution(MAX_SHARED_AMOUNT, 1)).toBe(MAX_SHARED_AMOUNT);
  });

  it('steps by as much in the pot’s own currency', () => {
    const usd = currencyOf('USD');
    // 50.000₫ is about $2, 100.000₫ about $4, 1tr about $40, 5tr about $200 (500k about $20).
    expect(minStepAmount(usd)).toBe(200);
    expect(startStepAmount(usd)).toBe(400);
    expect(stepContribution(400, 1, usd)).toBe(600);
    expect(stepContribution(200, -1, usd)).toBe(200);
    expect(stepContribution(4_000, 1, usd)).toBe(4_400);
    expect(stepContribution(20_000, 1, usd)).toBe(22_000);
    expect(minStepAmount()).toBe(50_000);
    expect(startStepAmount()).toBe(100_000);
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

  it('rounds up to fifty steps of the pot’s currency', () => {
    // $3,000 left over two months is $1,500 a month, already on a $50 step.
    expect(sharedPotMonthly(300_000, 0, '2026-12', cycle, currencyOf('USD'))).toBe(150_000);
    // $1,000 over three months is $333.34 → $350.
    expect(sharedPotMonthly(100_000, 0, '2027-01', cycle, currencyOf('USD'))).toBe(35_000);
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

  it('keeps a pot in đồng when no currency is sent, and takes any 3-letter code', () => {
    const fields = { name: 'Đà Lạt', icon: 'flight', hue: 85, goal: 3_000_000, neededBy: null };
    const pot = { ...fields, id: '0b6f0c2e-6a8d-4f8e-9c1b-2f3a4b5c6d7e' };
    expect(createSharedPotRequestSchema.parse(pot).currency).toBe('VND');
    expect(createSharedPotRequestSchema.parse({ ...pot, currency: 'USD' }).currency).toBe('USD');
    for (const currency of ['usd', 'US', 'USDT', 840, null]) {
      expect(createSharedPotRequestSchema.safeParse({ ...pot, currency }).success).toBe(false);
    }
    // An edit cannot move a pot to another currency.
    expect(editSharedPotRequestSchema.safeParse({ ...fields, currency: 'USD' }).success).toBe(
      false,
    );
    // A pot kept before pots had a currency reads as đồng.
    const kept = { ...pot, createdBy: 'an', createdAt: '2026-10-13T00:00:00Z', contributions: [] };
    expect(sharedPotSchema.parse(kept).currency).toBe('VND');
  });

  it('refuses a pot with no name, a bad month or extra fields', () => {
    const pot = { name: 'Đà Lạt', icon: 'flight', hue: 85, goal: 3_000_000, neededBy: '2026-12' };
    expect(sharedPotFieldsSchema.safeParse(pot).success).toBe(true);
    expect(sharedPotFieldsSchema.safeParse({ ...pot, name: '  ' }).success).toBe(false);
    expect(sharedPotFieldsSchema.safeParse({ ...pot, neededBy: '2026-13' }).success).toBe(false);
    expect(sharedPotFieldsSchema.safeParse({ ...pot, extra: 1 }).success).toBe(false);
  });
});

describe('sharedInHome', () => {
  const quotes: Record<string, string> = { USD: '26000', EUR: '28000' };
  const dong = (code: string) => quotes[code] ?? null;
  const vnd = currencyOf('VND');
  const usd = currencyOf('USD');

  it('is the amount itself in the same currency', () => {
    expect(sharedInHome(150_000, vnd, vnd, dong)).toBe(150_000);
    expect(sharedInHome(1_234, usd, usd, () => null)).toBe(1_234);
  });

  it('counts a pot in another currency in the home one, through the đồng quotes', () => {
    // $12.34 at 26.000₫ is 320.840₫.
    expect(sharedInHome(1_234, usd, vnd, dong)).toBe(320_840);
    // 520.000₫ is $20.
    expect(sharedInHome(520_000, vnd, usd, dong)).toBe(2_000);
    // €10 at 28.000₫ over 26.000₫ is $10.77.
    expect(sharedInHome(1_000, currencyOf('EUR'), usd, dong)).toBe(1_077);
    // ¥5 (no minor unit) needs its own quote.
    expect(sharedInHome(5, currencyOf('JPY'), vnd, dong)).toBeNull();
  });

  it('counts nothing on a guess when a quote is missing', () => {
    expect(sharedInHome(1_000, usd, vnd, () => null)).toBeNull();
  });
});
