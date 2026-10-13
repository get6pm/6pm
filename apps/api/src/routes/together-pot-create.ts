import { createSharedPotRequestSchema, MAX_SHARED_POTS } from '@6pm/domain';

import { ApiError } from '../errors';
import { readBody, type RouteDefinition } from '../route';
import { answerState, ensurePair, requirePot, requireUser } from '../together/store';

/**
 * A new shared pot in the person's pair (made for them if they have none yet). The phone picks
 * the id, so sending the same pot again changes nothing.
 */
export const togetherPotCreateRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/pots',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    const pot = await readBody(c, createSharedPotRequestSchema, { maxBytes: 2048 });
    const db = c.env.DB;
    const pairId = await ensurePair(db, user.id);
    const count = await db
      .prepare('SELECT COUNT(*) AS n FROM together_pots WHERE pair_id = ?')
      .bind(pairId)
      .first<{ n: number }>();
    if ((count?.n ?? 0) >= MAX_SHARED_POTS) {
      throw new ApiError('bad_request', 'Too many shared pots', { reason: 'too_many' });
    }
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO together_pots
           (id, pair_id, name, icon, hue, goal, needed_by, created_by, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
         ON CONFLICT (id) DO NOTHING`,
      )
      .bind(pot.id, pairId, pot.name, pot.icon, pot.hue, pot.goal, pot.neededBy, user.id, now)
      .run();
    // An id another pair already holds is not this pair's to see.
    await requirePot(db, pairId, pot.id);
    return answerState(c, user);
  },
};
