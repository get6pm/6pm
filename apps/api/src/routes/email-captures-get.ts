import { EMAIL_CAPTURES_PAGE, type EmailCapture } from '@6pm/domain';

import { ApiError } from '../errors';
import { openCapture, sealKeyOf } from '../receipt-email/seal';
import type { RouteDefinition } from '../route';

/**
 * The receipts waiting for this phone, oldest first, at most a page of them. Nothing is deleted
 * here: the phone saves them, then acknowledges. A row that no longer opens (the seal key was
 * replaced) can never be read, so it is deleted instead of being sent.
 */
export const emailCapturesGetRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/email/captures',
  access: 'device',
  handle: async (c) => {
    const secret = sealKeyOf(c.env);
    if (secret === null) throw new ApiError('internal', 'Receipt email is not set up');
    const deviceHash = c.var.device.hash;
    const { results } = await c.env.DB.prepare(
      `SELECT id, sealed FROM email_captures WHERE device_hash = ?
       ORDER BY received_at, id LIMIT ?`,
    )
      .bind(deviceHash, EMAIL_CAPTURES_PAGE)
      .all<{ id: string; sealed: string }>();
    const captures: EmailCapture[] = [];
    const broken: string[] = [];
    for (const row of results) {
      const capture = await openCapture(secret, deviceHash, row.id, row.sealed);
      if (capture) captures.push(capture);
      else broken.push(row.id);
    }
    if (broken.length > 0) {
      await c.env.DB.batch(
        broken.map((id) =>
          c.env.DB.prepare('DELETE FROM email_captures WHERE id = ? AND device_hash = ?').bind(
            id,
            deviceHash,
          ),
        ),
      );
    }
    c.header('Cache-Control', 'no-store');
    return c.json({ captures });
  },
};
