import type { LookId } from '@6pm/theme';

/** The six classic looks, 49.000₫ each, bought once. */
export const CLASSIC_LOOKS = ['lacquer', 'glaze', 'riso', 'monsoon', 'cafe', 'neon'] as const;
/** The three living scenes, 99.000₫ each, bought once. */
export const SCENE_LOOKS = ['expo', 'paper', 'lantern'] as const;
/** Every look that is sold: the rest of the catalogue (Basic, Golden Hour) is free. */
export const PAID_LOOKS = [...CLASSIC_LOOKS, ...SCENE_LOOKS] as const satisfies readonly LookId[];
export type PaidLookId = (typeof PAID_LOOKS)[number];

export function isPaidLook(id: string): id is PaidLookId {
  return (PAID_LOOKS as readonly string[]).includes(id);
}

/**
 * Product identifiers as they exist in App Store Connect and Google Play. One set for every build:
 * the dev app resolves them through the sandbox (or a Play testing track) like the production app.
 */
const STORE_PREFIX = 'ai.sixpm.app';

/** A look's one-time purchase (a non-consumable). */
export function lookProductId(look: PaidLookId): string {
  return `${STORE_PREFIX}.look.${look}`;
}

/** The RevenueCat entitlement a look's purchase grants. */
export function lookEntitlementId(look: PaidLookId): string {
  return `look_${look}`;
}

export const MAX_PLANS = ['monthly', 'yearly'] as const;
export type MaxPlan = (typeof MAX_PLANS)[number];

/** Max, one month or one year, in the existing "Premium Subscriptions" group. */
export const MAX_PRODUCTS: Readonly<Record<MaxPlan, string>> = {
  monthly: `${STORE_PREFIX}.max.monthly`,
  yearly: `${STORE_PREFIX}.max.yearly`,
};

/**
 * The one entitlement Max is. RevenueCat grants it for both Max products and for the earlier
 * subscriptions, so the app only ever asks for this and never for a product identifier.
 */
export const MAX_ENTITLEMENT = 'max';

/** The plan the Max sheet opens on. */
export const PRESELECTED_MAX_PLAN: MaxPlan = 'yearly';

export const LOOK_PRODUCT_IDS: readonly string[] = PAID_LOOKS.map(lookProductId);

/**
 * The product a store identifier names. Google Play names a subscription with its base plan
 * (`ai.sixpm.app.max.yearly:yearly`); the App Store and one-time products name the product alone.
 */
export function storeProductOf(identifier: string): string {
  const colon = identifier.indexOf(':');
  return colon === -1 ? identifier : identifier.slice(0, colon);
}

export function lookOfProduct(productId: string): PaidLookId | null {
  const product = storeProductOf(productId);
  return PAID_LOOKS.find((look) => lookProductId(look) === product) ?? null;
}

export function maxPlanOfProduct(productId: string): MaxPlan | null {
  const product = storeProductOf(productId);
  return MAX_PLANS.find((plan) => MAX_PRODUCTS[plan] === product) ?? null;
}

const DAYS_IN: Readonly<Record<string, number>> = { D: 1, W: 7, M: 30, Y: 365 };

/** An ISO 8601 period (`P1W`, `P7D`, `P1M`) in days, as the store counts a free trial; null if unread. */
export function daysOfPeriod(iso: string): number | null {
  const match = /^P(\d+)([DWMY])$/.exec(iso);
  if (!match) return null;
  const perUnit = DAYS_IN[match[2] ?? ''];
  return perUnit === undefined ? null : Number(match[1]) * perUnit;
}

/** The pages a subscription screen must link to. */
export const LEGAL_LINKS = {
  terms: 'https://at6pm.app/terms',
  privacy: 'https://at6pm.app/privacy',
  /** 6pm's source, open under the Apache License 2.0. */
  source: 'https://github.com/at6pm/6pm',
} as const;
