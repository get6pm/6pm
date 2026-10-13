import { appleSignInRequestSchema } from '@6pm/domain';

import { readBody, type RouteDefinition } from '../route';
import { verifyIdentityToken } from '../together/apple-identity';
import { exchangeAppleCode } from '../together/apple-tokens';
import { answerState, type TogetherUser } from '../together/store';

/**
 * Signs this phone in to Budget together with an Apple identity token. The person is found by
 * Apple's id for them, or made the first time, and the device is linked to them (a device is
 * signed in as one person at a time). Only the given name is kept, and only if Apple sent it.
 */
export const togetherSignInRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/sign-in',
  access: 'device',
  handle: async (c) => {
    const body = await readBody(c, appleSignInRequestSchema, { maxBytes: 8192 });
    const identity = await verifyIdentityToken(body.identityToken);
    const db = c.env.DB;
    const now = new Date().toISOString();

    const refreshToken =
      body.authorizationCode === undefined
        ? null
        : await exchangeAppleCode(c.env, identity.audience, body.authorizationCode);

    await db
      .prepare(
        `INSERT INTO together_users (id, apple_sub, name, apple_refresh_token, apple_client_id, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT (apple_sub) DO UPDATE SET
           name = COALESCE(excluded.name, together_users.name),
           apple_refresh_token = COALESCE(excluded.apple_refresh_token, together_users.apple_refresh_token),
           apple_client_id = CASE WHEN excluded.apple_refresh_token IS NULL
             THEN together_users.apple_client_id ELSE excluded.apple_client_id END`,
      )
      .bind(
        crypto.randomUUID(),
        identity.sub,
        body.name ?? null,
        refreshToken,
        refreshToken === null ? null : identity.audience,
        now,
      )
      .run();
    const user = await db
      .prepare('SELECT id, name FROM together_users WHERE apple_sub = ?')
      .bind(identity.sub)
      .first<TogetherUser>();
    if (user === null) throw new Error('The person was not written');

    await db
      .prepare(
        `INSERT INTO together_devices (device_hash, user_id, linked_at) VALUES (?1, ?2, ?3)
         ON CONFLICT (device_hash) DO UPDATE SET user_id = excluded.user_id, linked_at = excluded.linked_at`,
      )
      .bind(c.var.device.hash, user.id, now)
      .run();
    return answerState(c, user);
  },
};
