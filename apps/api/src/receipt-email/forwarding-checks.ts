import {
  FORWARDING_CHECK_TTL_MS,
  forwardingCheckSchema,
  type ForwardingCheck,
  type ForwardingConfirmation,
} from '@6pm/domain';

import { openFor, sealFor } from './seal';

const labelOf = (id: string) => `forwarding:${id}`;
const cutoff = (now: Date) => new Date(now.getTime() - FORWARDING_CHECK_TTL_MS).toISOString();

/**
 * Keeps a forwarding check for its phone, sealed, replacing any older one; checks past their week
 * are deleted on the way. False when what was read does not make a valid check.
 */
export async function storeForwardingCheck(
  db: D1Database,
  secret: string,
  deviceHash: string,
  read: ForwardingConfirmation,
  now: Date,
): Promise<boolean> {
  const check = forwardingCheckSchema.safeParse({
    id: crypto.randomUUID().replaceAll('-', ''),
    provider: read.provider,
    code: read.code,
    confirmUrl: read.confirmUrl,
    address: read.address,
    receivedAt: now.toISOString(),
  });
  if (!check.success) return false;
  const sealed = await sealFor(secret, deviceHash, labelOf(check.data.id), check.data);
  await db.batch([
    db.prepare('DELETE FROM email_forwarding_checks WHERE received_at < ?').bind(cutoff(now)),
    db
      .prepare(
        `INSERT INTO email_forwarding_checks (device_hash, id, sealed, received_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT (device_hash) DO UPDATE
           SET id = excluded.id, sealed = excluded.sealed, received_at = excluded.received_at`,
      )
      .bind(deviceHash, check.data.id, sealed, now.toISOString()),
  ]);
  return true;
}

/** The phone's waiting check, or null. One past its week, or that no longer opens, is deleted. */
export async function waitingForwardingCheck(
  db: D1Database,
  secret: string,
  deviceHash: string,
  now: Date,
): Promise<ForwardingCheck | null> {
  const row = await db
    .prepare('SELECT id, sealed, received_at FROM email_forwarding_checks WHERE device_hash = ?')
    .bind(deviceHash)
    .first<{ id: string; sealed: string; received_at: string }>();
  if (!row) return null;
  const parsed =
    row.received_at >= cutoff(now)
      ? forwardingCheckSchema.safeParse(
          await openFor(secret, deviceHash, labelOf(row.id), row.sealed),
        )
      : null;
  if (parsed?.success && parsed.data.id === row.id) return parsed.data;
  await dismissForwardingCheck(db, deviceHash, row.id);
  return null;
}

/** Deletes the phone's check when it is still the one dismissed; a newer one stays. */
export async function dismissForwardingCheck(
  db: D1Database,
  deviceHash: string,
  id: string,
): Promise<number> {
  const result = await db
    .prepare('DELETE FROM email_forwarding_checks WHERE device_hash = ? AND id = ?')
    .bind(deviceHash, id)
    .run();
  return result.meta.changes;
}
