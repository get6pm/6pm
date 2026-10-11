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

/** The plan's price over a month, in the store's own text: yearly is the store's per-month figure. */
export function perMonthText(offer: MaxOffer | undefined): string | null {
  if (!offer) return null;
  return offer.plan === 'yearly' ? offer.perMonthText : offer.priceText;
}

/** The lowest monthly figure Max is sold at, for the line on the shop's Max card. */
export function fromPerMonthText(offerings: Offerings): string | null {
  return perMonthText(offerings.max.yearly) ?? perMonthText(offerings.max.monthly);
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
