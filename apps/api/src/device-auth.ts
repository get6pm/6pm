import { deviceTokenPattern, type ApiLanguage as Language } from '@6pm/domain';
import { createMiddleware } from 'hono/factory';

import type { AppEnv } from './env';
import { ApiError } from './errors';

/** `last_seen_at` is for daily counts, so it is rewritten at most this often per device. */
const lastSeenStepMs = 60 * 60 * 1000;

/** SHA-256 of a token, hex. The database only ever sees this. */
export async function hashDeviceToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function newDeviceToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function bearerToken(header: string | undefined): string | undefined {
  const token = header?.match(/^Bearer (.+)$/)?.[1];
  return token !== undefined && deviceTokenPattern.test(token) ? token : undefined;
}

/** Lets a request through only with the bearer token of a registered device. */
export const requireDevice = createMiddleware<AppEnv>(async (c, next) => {
  const token = bearerToken(c.req.header('Authorization'));
  if (token === undefined) throw new ApiError('unauthorized', 'A device token is required');

  const hash = await hashDeviceToken(token);
  const row = await c.env.DB.prepare(
    'SELECT language, last_seen_at FROM devices WHERE token_hash = ?',
  )
    .bind(hash)
    .first<{ language: Language; last_seen_at: string }>();
  if (row === null) throw new ApiError('unauthorized', 'This device is not registered');

  const now = Date.now();
  if (now - Date.parse(row.last_seen_at) >= lastSeenStepMs) {
    await c.env.DB.prepare('UPDATE devices SET last_seen_at = ? WHERE token_hash = ?')
      .bind(new Date(now).toISOString(), hash)
      .run();
  }

  c.set('device', { hash, language: row.language });
  await next();
});
export { deviceTokenPattern };
