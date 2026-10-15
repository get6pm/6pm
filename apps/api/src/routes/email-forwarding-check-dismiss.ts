import { dismissForwardingCheckRequestSchema } from '@6pm/domain';

import { dismissForwardingCheck } from '../receipt-email/forwarding-checks';
import { readBody, type RouteDefinition } from '../route';

/**
 * The person is done with this forwarding check: it is deleted. A newer check that arrived since
 * stays, and a check already gone is no error.
 */
export const emailForwardingCheckDismissRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/email/forwarding-check/dismiss',
  access: 'device',
  handle: async (c) => {
    const { id } = await readBody(c, dismissForwardingCheckRequestSchema, { maxBytes: 1024 });
    return c.json({ removed: await dismissForwardingCheck(c.env.DB, c.var.device.hash, id) });
  },
};
