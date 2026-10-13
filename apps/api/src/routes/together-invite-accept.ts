import type { RouteDefinition } from '../route';
import { acceptInvite } from '../together/invites';
import { answerState, requireUser } from '../together/store';

/** Joins the pair an invite link was made for, and answers with the shared copy. */
export const togetherInviteAcceptRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/invites/:code/accept',
  access: 'device',
  handle: async (c) => {
    const user = await requireUser(c);
    await acceptInvite(c.env.DB, user.id, c.req.param('code') ?? '');
    return answerState(c, user);
  },
};
