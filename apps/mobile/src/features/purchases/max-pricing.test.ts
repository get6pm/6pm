import { describe, expect, it } from '@jest/globals';

import {
  anyTrialDays,
  fromPerMonthText,
  perMonthText,
  trialDaysFor,
  yearlySavingPercent,
} from './max-pricing';
import { maxStatus } from './max-status';
import type { MaxOffer, Offerings } from './purchases-port';

const monthly: MaxOffer = {
  plan: 'monthly',
  productId: 'ai.sixpm.app.max.monthly',
  priceText: '99.000₫',
  price: 99_000,
  perMonthText: '99.000₫',
  perMonth: 99_000,
  trialDays: 7,
};
const yearly: MaxOffer = {
  plan: 'yearly',
  productId: 'ai.sixpm.app.max.yearly',
  priceText: '799.000₫',
  price: 799_000,
  perMonthText: '66.583₫',
  perMonth: 66_583,
  trialDays: 7,
};
const both: Offerings = { looks: {}, max: { monthly, yearly } };

describe('Max pricing from the store’s prices', () => {
  it('works the yearly saving out of the two prices', () => {
    expect(yearlySavingPercent(both)).toBe(33);
  });

  it('claims no saving without both plans, or when the yearly plan is not cheaper', () => {
    expect(yearlySavingPercent({ looks: {}, max: { yearly } })).toBeNull();
    expect(
      yearlySavingPercent({ looks: {}, max: { monthly, yearly: { ...yearly, price: 1_188_000 } } }),
    ).toBeNull();
  });

  it('shows the store’s per-month text, and none when the store gave none', () => {
    expect(perMonthText(yearly)).toBe('66.583₫');
    expect(perMonthText(monthly)).toBe('99.000₫');
    expect(perMonthText({ ...yearly, perMonthText: null })).toBeNull();
    expect(perMonthText(undefined)).toBeNull();
    expect(fromPerMonthText(both)).toBe('66.583₫');
    expect(fromPerMonthText({ looks: {}, max: { monthly } })).toBe('99.000₫');
    expect(fromPerMonthText({ looks: {}, max: {} })).toBeNull();
  });

  it('promises a trial only when the store offers this Apple ID one', () => {
    expect(trialDaysFor(both, 'yearly')).toBe(7);
    expect(
      trialDaysFor({ looks: {}, max: { yearly: { ...yearly, trialDays: null } } }, 'yearly'),
    ).toBeNull();
    expect(
      trialDaysFor({ looks: {}, max: { yearly: { ...yearly, trialDays: 0 } } }, 'yearly'),
    ).toBeNull();
    expect(anyTrialDays(both)).toBe(7);
    expect(anyTrialDays({ looks: {}, max: {} })).toBeNull();
  });
});

describe('what a Max customer is told about their plan', () => {
  const active = {
    active: true,
    plan: 'yearly' as const,
    inTrial: false,
    trialEndsAt: null,
    renewsAt: 200,
    endsAt: null,
    willRenew: true,
  };
  it('tells a trial’s end first, then the renewal, then the end of a cancelled plan', () => {
    expect(maxStatus({ ...active, inTrial: true, trialEndsAt: 100 })).toEqual({
      kind: 'trialEnds',
      at: 100,
    });
    expect(maxStatus(active)).toEqual({ kind: 'renews', at: 200 });
    expect(maxStatus({ ...active, willRenew: false, renewsAt: null, endsAt: 300 })).toEqual({
      kind: 'ends',
      at: 300,
    });
  });
  it('says nothing when Max is off or the store gave no date', () => {
    expect(maxStatus({ ...active, active: false })).toBeNull();
    expect(maxStatus({ ...active, renewsAt: null })).toBeNull();
  });
});
