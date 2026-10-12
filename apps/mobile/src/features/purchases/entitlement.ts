import { DEFAULT_LOOK, LOOK_IDS, type LookId } from '@6pm/theme';

import type { CompanionForm } from '../../ui/companion/companion-mood';
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

/** Members wear the Max companion while Max is on, a free trial included; everyone else the base. */
export function companionForm(customer: CustomerState): CompanionForm {
  return customer.max.active ? 'max' : 'base';
}
