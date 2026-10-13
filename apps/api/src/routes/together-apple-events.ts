import { z } from 'zod';

import { ApiError } from '../errors';
import { readBody, type RouteDefinition } from '../route';
import { verifyAppleJwt } from '../together/apple-identity';
import { deleteUser } from '../together/store';

const bodySchema = z.object({ payload: z.string().min(20).max(8192) });
const eventSchema = z.object({ type: z.string(), sub: z.string().min(1) });

/** The events after which the person's Budget together data is deleted. */
const ENDS = new Set(['consent-revoked', 'account-delete']);

/**
 * Sign in with Apple's server-to-server notifications (registered for the app ids in the Apple
 * developer account). Apple signs each one. When someone stops using Sign in with Apple for 6pm,
 * or deletes their Apple ID, their Budget together account and pair are deleted here, just as the
 * in-app delete does. Other events are acknowledged and ignored.
 */
export const togetherAppleEventsRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/apple-events',
  access: 'public',
  handle: async (c) => {
    const { payload } = await readBody(c, bodySchema, { maxBytes: 10_000 });
    const claims = await verifyAppleJwt(payload);
    const raw = claims['events'];
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    const event = eventSchema.safeParse(parsed);
    if (!event.success) throw new ApiError('bad_request', 'No event in the notification');
    if (ENDS.has(event.data.type)) {
      const user = await c.env.DB.prepare('SELECT id FROM together_users WHERE apple_sub = ?')
        .bind(event.data.sub)
        .first<{ id: string }>();
      if (user !== null) await deleteUser(c.env, user.id);
    }
    return c.json({ ok: true as const });
  },
};
