import { LOOK_IDS, lookById, type LookId } from '@6pm/theme';

import { lookAccess } from '../purchases/entitlement';
import { PAID_LOOKS } from '../purchases/products';
import type { CustomerState } from '../purchases/purchases-port';

/** A living scene (Long Exposure, Paper Diorama, Lantern River): a wider card, a dearer look. */
export function isScene(look: LookId): boolean {
  return lookById(look).tier === 'premium';
}

/** The shop's order: the classic looks first, then the living scenes. */
export const SHOP_ORDER: readonly LookId[] = [
  ...LOOK_IDS.filter((id) => !isScene(id)),
  ...LOOK_IDS.filter(isScene),
];

/** The look before or after another, in catalogue order, wrapping round. */
export function neighbour(look: LookId, step: 1 | -1): LookId {
  const at = LOOK_IDS.indexOf(look);
  return LOOK_IDS[(at + step + LOOK_IDS.length) % LOOK_IDS.length] ?? look;
}

/** "3 of 11": the look's place in the catalogue. */
export function positionOf(look: LookId): { readonly index: number; readonly total: number } {
  return { index: LOOK_IDS.indexOf(look) + 1, total: LOOK_IDS.length };
}

/** What a look card's badge says, as the shop shows it. */
export type CardBadge = 'inUse' | 'free' | 'max' | 'owned' | 'price';

export function cardBadge(look: LookId, worn: LookId, customer: CustomerState): CardBadge {
  if (look === worn) return 'inUse';
  switch (lookAccess(look, customer)) {
    case 'free':
      return 'free';
    case 'max':
      return 'max';
    case 'owned':
      return 'owned';
    case 'locked':
      return 'price';
  }
}

/** The line under the Look card in Settings. */
export type ShopSub =
  | { readonly kind: 'max' }
  | { readonly kind: 'all' }
  | { readonly kind: 'more'; readonly count: number };

export function shopSub(customer: CustomerState): ShopSub {
  if (customer.max.active) return { kind: 'max' };
  const count = PAID_LOOKS.filter((look) => !customer.ownedLooks.includes(look)).length;
  return count === 0 ? { kind: 'all' } : { kind: 'more', count };
}
