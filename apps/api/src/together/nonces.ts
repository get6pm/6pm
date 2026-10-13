import { newDeviceToken } from '../device-auth';
import { ApiError } from '../errors';
import { sha256Hex } from './apple-identity';

/** How long a sign-in nonce works. */
export const NONCE_TTL_MS = 10 * 60 * 1000;

/**
 * A fresh nonce for one Sign in with Apple from this device. Only its SHA-256 (what the identity
 * token will carry) is stored; the device's expired ones are cleared on the way.
 */
export async function issueNonce(
  db: D1Database,
  deviceHash: string,
  now = Date.now(),
): Promise<string> {
  const nonce = newDeviceToken();
  const at = new Date(now).toISOString();
  await db.batch([
    db.prepare('DELETE FROM together_nonces WHERE expires_at <= ?').bind(at),
    db
      .prepare('INSERT INTO together_nonces (nonce_hash, device_hash, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256Hex(nonce), deviceHash, new Date(now + NONCE_TTL_MS).toISOString()),
  ]);
  return nonce;
}

/**
 * Uses up a nonce: it must have been handed to this device and not have expired or been used.
 * Anything else is the same refusal as a token that does not check out.
 */
export async function consumeNonce(
  db: D1Database,
  deviceHash: string,
  nonce: string,
  now = Date.now(),
): Promise<void> {
  const result = await db
    .prepare(
      'DELETE FROM together_nonces WHERE nonce_hash = ? AND device_hash = ? AND expires_at > ?',
    )
    .bind(await sha256Hex(nonce), deviceHash, new Date(now).toISOString())
    .run();
  if (result.meta.changes !== 1) {
    throw new ApiError('forbidden', 'The Apple sign-in could not be checked', {
      reason: 'apple_refused',
    });
  }
}
