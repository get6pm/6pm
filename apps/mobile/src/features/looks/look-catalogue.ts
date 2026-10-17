import { LOOK_IDS, lookById, type LookId } from '@6pm/theme';

import { lookAccess } from '../purchases/entitlement';
import { isPaidLook, PAID_LOOKS } from '../purchases/products';
import type { CustomerState } from '../purchases/purchases-port';

/** A living scene (Long Exposure, Paper Diorama, Lantern River): a wider card, a dearer look. */
export function isScene(look: LookId): boolean {
  return lookById(look).tier === 'premium';
}

/** The shop's three shelves: the looks that come with 6pm, the classic looks, the living scenes. */
export const SHOP_TIERS = ['free', 'classic', 'scene'] as const;
export type ShopTier = (typeof SHOP_TIERS)[number];

export function tierOf(look: LookId): ShopTier {
  if (isScene(look)) return 'scene';
  return isPaidLook(look) ? 'classic' : 'free';
}

/** The shop's order, shelf by shelf: Basic and Golden Hour, the classic looks, the living scenes. */
export const SHOP_ORDER: readonly LookId[] = SHOP_TIERS.flatMap((tier) =>
  LOOK_IDS.filter((id) => tierOf(id) === tier),
);

/** Where a shelf starts in the shop's order. */
export function firstOfTier(tier: ShopTier): number {
  return SHOP_ORDER.findIndex((id) => tierOf(id) === tier);
}

/** The look before or after another, in the shop's order, wrapping round. */
export function neighbour(look: LookId, step: 1 | -1): LookId {
  const at = SHOP_ORDER.indexOf(look);
  return SHOP_ORDER[(at + step + SHOP_ORDER.length) % SHOP_ORDER.length] ?? look;
}

/** "3 of 11": the look's place in the shop. */
export function positionOf(look: LookId): { readonly index: number; readonly total: number } {
  return { index: SHOP_ORDER.indexOf(look) + 1, total: SHOP_ORDER.length };
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
