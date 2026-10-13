import type { RouteDefinition } from '../route';
import { answerState, requirePair, requireUser } from '../together/store';

/**
 * Takes back a contribution. Only the person who added it can, and only in their own pair;
 * one that is already gone answers the same.
 */
export const togetherContributionDeleteRoute: RouteDefinition = {
  method: 'DELETE',
  path: '/v1/together/contributions/:id',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    const db = c.env.DB;
    const pairId = await requirePair(db, user.id);
    await db
      .prepare(
        `DELETE FROM together_contributions WHERE id = ? AND user_id = ?
           AND pot_id IN (SELECT id FROM together_pots WHERE pair_id = ?)`,
      )
      .bind(c.req.param('id') ?? '', user.id, pairId)
      .run();
    return answerState(c, user);
  },
};
