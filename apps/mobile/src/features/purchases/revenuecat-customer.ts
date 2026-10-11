import {
  MAX_ENTITLEMENT,
  PAID_LOOKS,
  lookEntitlementId,
  lookProductId,
  maxPlanOfProduct,
  type PaidLookId,
} from './products';
import { FREE_CUSTOMER, NO_MAX, type CustomerState, type MaxState } from './purchases-port';

/** The parts of RevenueCat's entitlement record this app reads. */
export interface StoreEntitlement {
  readonly isActive: boolean;
  readonly willRenew: boolean;
  readonly periodType: string;
  readonly productIdentifier: string;
  readonly expirationDateMillis: number | null;
}

/** The parts of RevenueCat's customer record this app reads. */
export interface StoreCustomer {
  readonly entitlements: {
    readonly active: Readonly<Record<string, StoreEntitlement>>;
    readonly all: Readonly<Record<string, StoreEntitlement>>;
  };
  readonly nonSubscriptionTransactions: readonly { readonly productIdentifier: string }[];
}

function maxOf(store: StoreCustomer): MaxState {
  const active = store.entitlements.active[MAX_ENTITLEMENT];
  if (!active?.isActive) return NO_MAX;
  const until = active.expirationDateMillis;
  const inTrial = active.periodType === 'TRIAL';
  return {
    active: true,
    plan: maxPlanOfProduct(active.productIdentifier) ?? 'legacy',
    inTrial,
    trialEndsAt: inTrial ? until : null,
    renewsAt: active.willRenew ? until : null,
    endsAt: active.willRenew ? null : until,
    willRenew: active.willRenew,
  };
}

/**
 * A look is owned when its entitlement is active. A look with no entitlement on record falls
 * back to the purchase itself, so a product that was never attached to one still unlocks. An
 * entitlement on record that is no longer active (a refund) wins over the old transaction.
 */
function ownsLook(store: StoreCustomer, look: PaidLookId): boolean {
  const entitlement = store.entitlements.all[lookEntitlementId(look)];
  if (entitlement) return entitlement.isActive;
  const product = lookProductId(look);
  return store.nonSubscriptionTransactions.some((t) => t.productIdentifier === product);
}

/**
 * Reads RevenueCat's customer record into the app's own words. Pure, so the mapping is tested
 * without the SDK.
 */
export function customerFromStore(store: StoreCustomer): CustomerState {
  const ownedLooks = PAID_LOOKS.filter((look) => ownsLook(store, look));
  const max = maxOf(store);
  return max === NO_MAX && ownedLooks.length === 0 ? FREE_CUSTOMER : { max, ownedLooks };
}
