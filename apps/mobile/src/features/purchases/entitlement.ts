import { DEFAULT_LOOK, LOOK_IDS, type LookId } from '@6pm/theme';

import type { CompanionSettings } from '../../data/companion-settings';
import { isMaxForm, type CompanionForm } from '../../ui/companion/companion-mood';
import { isPaidLook } from './products';
import type { CustomerState } from './purchases-port';

/** Why a look can be worn: `free` ships with the app, `owned` was bought, `max` comes with Max. */
export type LookAccess = 'free' | 'owned' | 'max' | 'locked';

/** How a customer holds a look. A look bought one by one stays `owned` even while Max is on. */
export function lookAccess(look: LookId, customer: CustomerState): LookAccess {
  if (!isPaidLook(look)) return 'free';
  if (customer.ownedLooks.includes(look)) return 'owned';
  return customer.max.active ? 'max' : 'locked';
}

/** The looks that can be worn: the free ones, the ones bought, and every look while Max is on. */
export function usableLooks(customer: CustomerState): ReadonlySet<LookId> {
  return new Set(LOOK_IDS.filter((look) => lookAccess(look, customer) !== 'locked'));
}

export function canUseLook(look: LookId, customer: CustomerState): boolean {
  return lookAccess(look, customer) !== 'locked';
}

/**
 * The look the app wears: the chosen one, or Golden Hour when it is no longer the customer's
 * (Max ended, a purchase was refunded).
 */
export function resolveLook(chosen: LookId, customer: CustomerState): LookId {
  return canUseLook(chosen, customer) ? chosen : DEFAULT_LOOK;
}

/** Every free companion is everyone's; the Max form and the paper crane while Max is on. */
export function canUseCompanion(form: CompanionForm, customer: CustomerState): boolean {
  return !isMaxForm(form) || customer.max.active;
}

/**
 * The companion the app wears. Until one is picked, members wear the Max form and everyone else
 * the sun. A pick is worn while it is the customer's; a Max-only pick after Max ends falls back to
 * the last free pick, the way a look falls back to Golden Hour.
 */
export function resolveCompanion(
  settings: CompanionSettings,
  customer: CustomerState,
): CompanionForm {
  const { chosen, lastFree } = settings;
  if (chosen === null) return customer.max.active ? 'max' : lastFree;
  return canUseCompanion(chosen, customer) ? chosen : lastFree;
}

/**
 * The companion the Home Screen icon shows, or null for the app's own icon (the sun). It follows
 * the companion worn while that is switched on; a Max-only pick after Max ends goes back to the
 * app's own icon rather than to the fallback.
 */
export function appIconCompanion(
  settings: CompanionSettings,
  customer: CustomerState,
): CompanionForm | null {
  if (!settings.icon) return null;
  if (settings.chosen !== null && !canUseCompanion(settings.chosen, customer)) return null;
  const worn = resolveCompanion(settings, customer);
  return worn === 'sun' ? null : worn;
}
