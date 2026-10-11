import { describe, expect, it } from '@jest/globals';

import { parseCustomer, serializeCustomer } from './customer-memory';
import { FREE_CUSTOMER, type CustomerState } from './purchases-port';
import {
  customerFromStore,
  type StoreCustomer,
  type StoreEntitlement,
} from './revenuecat-customer';

const entitlement = (over: Partial<StoreEntitlement> = {}): StoreEntitlement => ({
  isActive: true,
  willRenew: true,
  periodType: 'NORMAL',
  productIdentifier: 'ai.sixpm.app.max.yearly',
  expirationDateMillis: 1_800_000_000_000,
  ...over,
});

const store = (over: Partial<StoreCustomer> = {}): StoreCustomer => ({
  entitlements: { active: {}, all: {} },
  nonSubscriptionTransactions: [],
  ...over,
});

describe('customerFromStore', () => {
  it('reads a customer with nothing as the free customer', () => {
    expect(customerFromStore(store())).toBe(FREE_CUSTOMER);
  });

  it('reads Max in its trial, with the store’s dates', () => {
    const trial = entitlement({ periodType: 'TRIAL' });
    const customer = customerFromStore(
      store({ entitlements: { active: { max: trial }, all: {} } }),
    );
    expect(customer.max).toEqual({
      active: true,
      plan: 'yearly',
      inTrial: true,
      trialEndsAt: 1_800_000_000_000,
      renewsAt: 1_800_000_000_000,
      endsAt: null,
      willRenew: true,
    });
  });

  it('reads a cancelled Max as ending, not renewing', () => {
    const cancelled = entitlement({
      willRenew: false,
      productIdentifier: 'ai.sixpm.app.max.monthly',
    });
    const { max } = customerFromStore(
      store({ entitlements: { active: { max: cancelled }, all: {} } }),
    );
    expect(max).toMatchObject({ plan: 'monthly', renewsAt: null, endsAt: 1_800_000_000_000 });
  });

  it('gives an earlier 6pm subscriber Max through the same entitlement', () => {
    const v1 = entitlement({ productIdentifier: 'growth_monthly' });
    const { max } = customerFromStore(store({ entitlements: { active: { max: v1 }, all: {} } }));
    expect(max).toMatchObject({ active: true, plan: 'legacy' });
  });

  it('does not count an expired Max', () => {
    const expired = entitlement({ isActive: false });
    const customer = customerFromStore(
      store({ entitlements: { active: {}, all: { max: expired } } }),
    );
    expect(customer.max.active).toBe(false);
  });

  it('owns a look through its entitlement', () => {
    const neon = entitlement({ productIdentifier: 'ai.sixpm.app.look.neon' });
    const customer = customerFromStore(
      store({ entitlements: { active: { look_neon: neon }, all: { look_neon: neon } } }),
    );
    expect(customer.ownedLooks).toEqual(['neon']);
  });

  it('owns a look through its purchase when no entitlement is on record', () => {
    const customer = customerFromStore(
      store({
        nonSubscriptionTransactions: [
          { productIdentifier: 'ai.sixpm.app.look.riso' },
          { productIdentifier: 'something.else' },
        ],
      }),
    );
    expect(customer.ownedLooks).toEqual(['riso']);
  });

  it('lets a refunded entitlement win over the old transaction', () => {
    const refunded = entitlement({ isActive: false });
    const customer = customerFromStore(
      store({
        entitlements: { active: {}, all: { look_neon: refunded } },
        nonSubscriptionTransactions: [{ productIdentifier: 'ai.sixpm.app.look.neon' }],
      }),
    );
    expect(customer.ownedLooks).toEqual([]);
  });
});

describe('the customer kept between launches', () => {
  const customer: CustomerState = {
    max: {
      active: true,
      plan: 'monthly',
      inTrial: false,
      trialEndsAt: null,
      renewsAt: 1,
      endsAt: null,
      willRenew: true,
    },
    ownedLooks: ['holo', 'paper'],
  };

  it('round-trips', () => {
    expect(parseCustomer(serializeCustomer(customer))).toEqual(customer);
  });

  it('reads nothing, bad JSON and the wrong shape as the free customer', () => {
    expect(parseCustomer(null)).toBe(FREE_CUSTOMER);
    expect(parseCustomer('{nope')).toBe(FREE_CUSTOMER);
    expect(parseCustomer('{"max":true,"ownedLooks":["neon"]}')).toBe(FREE_CUSTOMER);
    expect(parseCustomer(JSON.stringify({ ...customer, ownedLooks: ['golden'] }))).toBe(
      FREE_CUSTOMER,
    );
  });
});
