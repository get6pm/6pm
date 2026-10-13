import type { RouteDefinition } from '../route';
import { answerState, requirePair, requireUser } from '../together/store';

/**
 * Deletes a shared pot and what both partners put in it, from the server. Each phone keeps its
 * own person's contributions as history. Deleting a pot that is already gone answers the same.
 */
export const togetherPotDeleteRoute: RouteDefinition = {
  method: 'DELETE',
  path: '/v1/together/pots/:id',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    const db = c.env.DB;
    const pairId = await requirePair(db, user.id);
    await db
      .prepare('DELETE FROM together_pots WHERE id = ? AND pair_id = ?')
      .bind(c.req.param('id') ?? '', pairId)
      .run();
    return answerState(c, user);
  },
};
