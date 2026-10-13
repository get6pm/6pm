import type { RouteDefinition } from '../route';
import { createInvite } from '../together/invites';
import { ensurePair, requireUser } from '../together/store';

/**
 * A new invite link code for the person's pair (made for them if they have none yet). It works
 * once and for a week; asking again replaces an invite nobody has taken.
 */
export const togetherInviteCreateRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/invites',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    const pairId = await ensurePair(c.env.DB, user.id);
    const invite = await createInvite(c.env.DB, user.id, pairId);
    c.header('Cache-Control', 'no-store');
    return c.json(invite);
  },
};
