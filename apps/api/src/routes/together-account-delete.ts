import type { RouteDefinition } from '../route';
import { deleteUser, userOfDevice } from '../together/store';

/**
 * Deletes the Budget together account this phone is signed in as: the app's access is revoked
 * with Apple, the pair and everything shared in it is deleted, and so are the person and every
 * device link. The anonymous device stays, as the rest of 6pm needs no account. Answers the same
 * when there is no account.
 */
export const togetherAccountDeleteRoute: RouteDefinition = {
  method: 'DELETE',
  path: '/v1/together/account',
  access: 'device',
  handle: async (c) => {
    const user = await userOfDevice(c.env.DB, c.var.device.hash);
    if (user !== null) await deleteUser(c.env, user.id);
    c.header('Cache-Control', 'no-store');
    return c.json({ deleted: true as const });
  },
};
