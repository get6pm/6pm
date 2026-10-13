import { z } from 'zod';

import { ApiError } from '../errors';
import { readBody, type RouteDefinition } from '../route';
import { NOTIFICATION_MAX_AGE_S, verifyAppleNotification } from '../together/apple-identity';
import { deleteUser } from '../together/store';

const bodySchema = z.object({ payload: z.string().min(20).max(8192) });
const eventSchema = z.object({
  type: z.string(),
  sub: z.string().min(1),
  /** Milliseconds since the epoch, as Apple sends it. */
  event_time: z.number().optional(),
});

/** The events after which the person's Budget together data is deleted. */
const ENDS = new Set(['consent-revoked', 'account-delete']);

/**
 * Sign in with Apple's server-to-server notifications (registered for the app ids in the Apple
 * developer account). Apple signs each one. When someone stops using Sign in with Apple for 6pm,
 * or deletes their Apple ID, their Budget together account and pair are deleted here, just as the
 * in-app delete does. Other events are acknowledged and ignored. A notification is taken only
 * while it is recent, and only once (by its `jti`), so an old consent-revoked cannot be replayed
 * against someone who has signed in again since.
 */
export const togetherAppleEventsRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/apple-events',
  access: 'public',
  handle: async (c) => {
    const { payload } = await readBody(c, bodySchema, { maxBytes: 10_000 });
    const notice = await verifyAppleNotification(payload);
    const now = Date.now();
    const db = c.env.DB;
    const [, seen] = await db.batch([
      db
        .prepare('DELETE FROM together_apple_events WHERE received_at < ?')
        .bind(new Date(now - 2 * NOTIFICATION_MAX_AGE_S * 1000).toISOString()),
      db
        .prepare(
          'INSERT INTO together_apple_events (jti, received_at) VALUES (?, ?) ON CONFLICT (jti) DO NOTHING',
        )
        .bind(notice.jti, new Date(now).toISOString()),
    ]);
    // Already acted on: answer the same, do nothing again.
    if ((seen?.meta.changes ?? 0) !== 1) return c.json({ ok: true as const });
    const raw = notice.events;
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
      const user = await db
        .prepare('SELECT id, created_at FROM together_users WHERE apple_sub = ?')
        .bind(event.data.sub)
        .first<{ id: string; created_at: string }>();
      // An event from before this person signed up again is about an account already gone.
      const before =
        event.data.event_time !== undefined &&
        user !== null &&
        event.data.event_time < Date.parse(user.created_at);
      if (user !== null && !before) await deleteUser(c.env, user.id);
    }
    return c.json({ ok: true as const });
  },
};
