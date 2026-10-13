import type { RouteDefinition } from '../route';
import { dissolvePair, pairOf, requireUser } from '../together/store';

/**
 * Leaves Budget together. Either partner can, and the pair ends for both: the shared copy (pots,
 * contributions, invites) is deleted from the server. Each phone keeps what its own person put
 * in. Leaving when not in a pair answers the same. The Apple sign-in stays.
 */
export const togetherLeaveRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/leave',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    const pairId = await pairOf(c.env.DB, user.id);
    if (pairId !== null) await dissolvePair(c.env.DB, pairId);
    c.header('Cache-Control', 'no-store');
    return c.json({ left: true as const });
  },
};
