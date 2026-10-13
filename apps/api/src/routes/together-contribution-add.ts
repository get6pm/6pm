import { addContributionRequestSchema, MAX_POT_CONTRIBUTIONS } from '@6pm/domain';

import { ApiError } from '../errors';
import { readBody, type RouteDefinition } from '../route';
import { answerState, requirePair, requirePot, requireUser } from '../together/store';

/**
 * Says the person put money into a shared pot: whole đồng, counted, never moved. The phone picks
 * the id, so sending the same contribution again adds it once.
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
    const count = await db
      .prepare('SELECT COUNT(*) AS n FROM together_contributions WHERE pot_id = ?')
      .bind(potId)
      .first<{ n: number }>();
    if ((count?.n ?? 0) >= MAX_POT_CONTRIBUTIONS) {
      throw new ApiError('bad_request', 'This pot holds no more entries', { reason: 'too_many' });
    }
    await db
      .prepare(
        `INSERT INTO together_contributions (id, pot_id, user_id, amount, added_at)
         VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      )
      .bind(id, potId, user.id, amount, new Date().toISOString())
      .run();
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
