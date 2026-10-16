import { addContributionRequestSchema, MAX_POT_CONTRIBUTIONS } from '@6pm/domain';

import { ApiError } from '../errors';
import { readBody, type RouteDefinition } from '../route';
import { answerState, requirePair, requirePot, requireUser } from '../together/store';

/**
 * Says the person put money into a shared pot: whole minor units of the pot's currency, counted,
 * never moved. The phone picks the id, so sending the same contribution again adds it once.
 */
export const togetherContributionAddRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/pots/:id/contributions',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    const { id, amount } = await readBody(c, addContributionRequestSchema, { maxBytes: 512 });
    const db = c.env.DB;
    const pairId = await requirePair(db, user.id);
    const potId = c.req.param('id') ?? '';
    await requirePot(db, pairId, potId);
    // The cap is checked in the insert itself, so two adds at once cannot both take the last place.
    const added = await db
      .prepare(
        `INSERT INTO together_contributions (id, pot_id, user_id, amount, added_at)
         SELECT ?1, ?2, ?3, ?4, ?5
         WHERE (SELECT COUNT(*) FROM together_contributions WHERE pot_id = ?2) < ?6
         ON CONFLICT (id) DO NOTHING`,
      )
      .bind(id, potId, user.id, amount, new Date().toISOString(), MAX_POT_CONTRIBUTIONS)
      .run();
    if (added.meta.changes === 0) {
      const taken = await db
        .prepare('SELECT 1 AS ok FROM together_contributions WHERE id = ?')
        .bind(id)
        .first();
      if (taken === null) {
        throw new ApiError('bad_request', 'This pot holds no more entries', { reason: 'too_many' });
      }
    }
    // The same id from someone else, or in another pot, is a clash, not a retry.
    const kept = await db
      .prepare(
        'SELECT 1 AS ok FROM together_contributions WHERE id = ? AND pot_id = ? AND user_id = ?',
      )
      .bind(id, potId, user.id)
      .first();
    if (kept === null) throw new ApiError('conflict', 'That id is taken');
    return answerState(c, user);
  },
};
