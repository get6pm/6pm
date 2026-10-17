import type { MaxPlan } from './products';
import type { MaxOffer, Offerings } from './purchases-port';

/**
 * How much cheaper a month is on the yearly plan, in whole percent, from the store's two prices.
 * Null when either plan is missing or the yearly plan saves nothing.
 */
export function yearlySavingPercent(offerings: Offerings): number | null {
  const monthly = offerings.max.monthly;
  const yearly = offerings.max.yearly;
  if (!monthly || !yearly || monthly.price <= 0) return null;
  const percent = Math.round((1 - yearly.price / (monthly.price * 12)) * 100);
  return percent > 0 ? percent : null;
}

/**
 * The plan the shop's Max card quotes, at the amount it is billed: yearly when the store sells it.
 * The billed amount is always the price shown, never a per-month figure worked out from it.
 */
export function quotedOffer(offerings: Offerings): MaxOffer | null {
  return offerings.max.yearly ?? offerings.max.monthly ?? null;
}

/** The free trial the plan offers this Apple ID, in days; null when it offers none. */
export function trialDaysFor(offerings: Offerings, plan: MaxPlan): number | null {
  const days = offerings.max[plan]?.trialDays ?? null;
  return days !== null && days > 0 ? days : null;
}

/** The trial the Max card can promise: the same on both plans, so the longest the store offers. */
export function anyTrialDays(offerings: Offerings): number | null {
  const days = [trialDaysFor(offerings, 'yearly'), trialDaysFor(offerings, 'monthly')].filter(
    (d): d is number => d !== null,
  );
  return days.length === 0 ? null : Math.max(...days);
}
