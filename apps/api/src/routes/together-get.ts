import type { RouteDefinition } from '../route';
import { answerState, userOfDevice } from '../together/store';

/**
 * Budget together as this phone may see it: `{me: null, pair: null}` when it is not signed in
 * with Apple, otherwise the person and their pair with every pot and contribution.
 */
export const togetherGetRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/together',
  access: 'device',
  handle: async (c) => {
    const user = await userOfDevice(c.env.DB, c.var.device.hash);
    if (user === null) {
      c.header('Cache-Control', 'no-store');
      return c.json({ me: null, pair: null });
    }
    return answerState(c, user);
  },
};
