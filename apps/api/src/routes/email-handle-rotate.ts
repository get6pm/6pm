import { assignHandle } from '../receipt-email/handles';
import type { RouteDefinition } from '../route';

/**
 * Replaces the phone's receipt email handle with a new random one. Mail to the old address is
 * refused from now on; receipts already waiting stay for the phone to fetch.
 */
export const emailHandleRotateRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/email/handle',
  access: 'device',
  handle: async (c) => {
    const handle = await assignHandle(c.env.DB, c.var.device.hash, true);
    c.header('Cache-Control', 'no-store');
    return c.json({ handle });
  },
};
