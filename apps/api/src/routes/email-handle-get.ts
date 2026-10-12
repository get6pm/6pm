import { assignHandle } from '../receipt-email/handles';
import type { RouteDefinition } from '../route';

/**
 * The phone's receipt email handle (`<handle>@<host>`), made the first time it asks. Asking again
 * gives the same one, so the phone can call this whenever it shows the address.
 */
export const emailHandleGetRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/email/handle',
  access: 'device',
  handle: async (c) => {
    const handle = await assignHandle(c.env.DB, c.var.device.hash, false);
    c.header('Cache-Control', 'no-store');
    return c.json({ handle });
  },
};
