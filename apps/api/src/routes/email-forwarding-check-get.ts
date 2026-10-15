import { ApiError } from '../errors';
import { waitingForwardingCheck } from '../receipt-email/forwarding-checks';
import { sealKeyOf } from '../receipt-email/seal';
import type { RouteDefinition } from '../route';

/**
 * The forwarding check waiting for this phone (a mail service's code and confirm link), or null.
 * Reading it deletes nothing: the phone dismisses it when the person is done.
 */
export const emailForwardingCheckGetRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/email/forwarding-check',
  access: 'device',
  handle: async (c) => {
    const secret = sealKeyOf(c.env);
    if (secret === null) throw new ApiError('internal', 'Receipt email is not set up');
    const check = await waitingForwardingCheck(c.env.DB, secret, c.var.device.hash, new Date());
    c.header('Cache-Control', 'no-store');
    return c.json({ check });
  },
};
