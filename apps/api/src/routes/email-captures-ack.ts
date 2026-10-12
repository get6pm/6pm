import { ackEmailCapturesRequestSchema } from '@6pm/domain';

import { readBody, type RouteDefinition } from '../route';

/**
 * The phone has saved these receipts: they are deleted. Only this phone's own rows go, and an id
 * already gone is no error, so a repeated acknowledgement changes nothing.
 */
export const emailCapturesAckRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/email/captures/ack',
  access: 'device',
  handle: async (c) => {
    const { ids } = await readBody(c, ackEmailCapturesRequestSchema, { maxBytes: 8 * 1024 });
    const unique = [...new Set(ids)];
    const placeholders = unique.map(() => '?').join(', ');
    const result = await c.env.DB.prepare(
      `DELETE FROM email_captures WHERE device_hash = ? AND id IN (${placeholders})`,
    )
      .bind(c.var.device.hash, ...unique)
      .run();
    return c.json({ removed: result.meta.changes });
  },
};
