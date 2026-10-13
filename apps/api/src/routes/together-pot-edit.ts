import { editSharedPotRequestSchema } from '@6pm/domain';

import { readBody, type RouteDefinition } from '../route';
import { answerState, requirePair, requirePot, requireUser } from '../together/store';

/** Changes a shared pot's name, look, goal or month. Either partner can. */
export const togetherPotEditRoute: RouteDefinition = {
  method: 'PUT',
  path: '/v1/together/pots/:id',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    const fields = await readBody(c, editSharedPotRequestSchema, { maxBytes: 2048 });
    const db = c.env.DB;
    const pairId = await requirePair(db, user.id);
    const potId = c.req.param('id') ?? '';
    await requirePot(db, pairId, potId);
    await db
      .prepare(
        `UPDATE together_pots SET name = ?, icon = ?, hue = ?, goal = ?, needed_by = ?, updated_at = ?
         WHERE id = ? AND pair_id = ?`,
      )
      .bind(
        fields.name,
        fields.icon,
        fields.hue,
        fields.goal,
        fields.neededBy,
        new Date().toISOString(),
        potId,
        pairId,
      )
      .run();
    return answerState(c, user);
  },
};
