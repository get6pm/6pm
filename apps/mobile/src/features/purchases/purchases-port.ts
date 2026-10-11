import { z } from 'zod';

import { PAID_LOOKS, type MaxPlan, type PaidLookId } from './products';

/** What the store says about Max for this Apple ID. Every date is the store's, never the phone's. */
export interface MaxState {
  readonly active: boolean;
  /** The plan that holds Max; `legacy` is an earlier 6pm subscription that also grants it. */
  readonly plan: MaxPlan | 'legacy' | null;
  readonly inTrial: boolean;
  /** When the trial ends and the first charge is made; null outside a trial. */
  readonly trialEndsAt: number | null;
  /** When the next renewal is charged; null when renewal is off. */
  readonly renewsAt: number | null;
  /** When a subscription that will not renew runs out; null when it renews. */
  readonly endsAt: number | null;
  readonly willRenew: boolean;
}

export interface CustomerState {
  readonly max: MaxState;
  /** The looks this Apple ID bought one by one. Max unlocks the rest without owning them. */
  readonly ownedLooks: readonly PaidLookId[];
}

export const NO_MAX: MaxState = {
  active: false,
  plan: null,
  inTrial: false,
  trialEndsAt: null,
  renewsAt: null,
  endsAt: null,
  willRenew: false,
};

export const FREE_CUSTOMER: CustomerState = { max: NO_MAX, ownedLooks: [] };

/** The shape the phone keeps between launches, so the first frame already wears the right look. */
export const customerSchema = z.object({
  max: z.object({
    active: z.boolean(),
    plan: z.enum(['monthly', 'yearly', 'legacy']).nullable(),
    inTrial: z.boolean(),
    trialEndsAt: z.number().nullable(),
    renewsAt: z.number().nullable(),
    endsAt: z.number().nullable(),
    willRenew: z.boolean(),
  }),
  ownedLooks: z.array(z.enum(PAID_LOOKS)),
});

/** A look as the store sells it here and now: the price is the store's own localised text. */
export interface LookOffer {
  readonly productId: string;
  readonly priceText: string;
}

export interface MaxOffer {
  readonly plan: MaxPlan;
  readonly productId: string;
  readonly priceText: string;
  /** The price in the store's currency, for comparing the plans. */
  readonly price: number;
  /** The store's own per-month figure for the plan, as localised text. */
  readonly perMonthText: string | null;
  readonly perMonth: number | null;
  /** The free trial this Apple ID is still offered on the plan, in days; null when there is none. */
  readonly trialDays: number | null;
}

export interface Offerings {
  readonly looks: Readonly<Partial<Record<PaidLookId, LookOffer>>>;
  readonly max: Readonly<Partial<Record<MaxPlan, MaxOffer>>>;
}

export type PurchaseOutcome =
  | { readonly kind: 'purchased'; readonly customer: CustomerState }
  /** The person closed the store's sheet. Nothing is wrong and nothing is said. */
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'failed' };

/** Thrown by every call when the store cannot be used on this phone at all. */
export class PurchasesUnavailable extends Error {
  constructor() {
    super('Purchases are unavailable');
    this.name = 'PurchasesUnavailable';
  }
}

/**
 * Everything the app asks of the store. Screens talk to this and never to an SDK, so the same
 * screens run on RevenueCat, on a fake in tests and on a build with no store configured.
 */
export interface PurchasesPort {
  /** False when no store is configured: every call then rejects with `PurchasesUnavailable`. */
  readonly available: boolean;
  offerings(): Promise<Offerings>;
  purchase(productId: string): Promise<PurchaseOutcome>;
  /** Brings back what this Apple ID bought. No account is involved. */
  restore(): Promise<CustomerState>;
  customer(): Promise<CustomerState>;
  /** Opens Apple's manage-subscriptions sheet, and resolves when it has closed. */
  manageSubscriptions(): Promise<void>;
  /** Tells the app when the store reports a change by itself. Returns the unsubscribe. */
  onCustomerChange(listener: (customer: CustomerState) => void): () => void;
}

/** The port of a build with no store: nothing can be bought, and it says so. */
export const unavailablePurchases: PurchasesPort = {
  available: false,
  offerings: () => Promise.reject(new PurchasesUnavailable()),
  purchase: () => Promise.reject(new PurchasesUnavailable()),
  restore: () => Promise.reject(new PurchasesUnavailable()),
  customer: () => Promise.reject(new PurchasesUnavailable()),
  manageSubscriptions: () => Promise.reject(new PurchasesUnavailable()),
  onCustomerChange: () => () => undefined,
};
