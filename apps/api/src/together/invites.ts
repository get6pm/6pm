import { INVITE_TTL_MS, inviteCodePattern, type InviteRefusal } from '@6pm/domain';

import { hashDeviceToken } from '../device-auth';
import { ApiError } from '../errors';
import { dissolvePair, pairOf } from './store';

/** 16 random bytes, URL-safe: an invite cannot be guessed. Only its hash is stored. */
export function newInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

const refuse = (reason: InviteRefusal, message: string) =>
  new ApiError('conflict', message, { reason });

async function memberCount(db: D1Database, pairId: string): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM together_members WHERE pair_id = ?')
    .bind(pairId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * A new invite to the person's pair, replacing any earlier one that was not taken. A pair that
 * already has two people takes no more.
 */
export async function createInvite(
  db: D1Database,
  userId: string,
  pairId: string,
  now = Date.now(),
): Promise<{ code: string; expiresAt: string }> {
  if ((await memberCount(db, pairId)) >= 2) refuseFull();
  const code = newInviteCode();
  const expiresAt = new Date(now + INVITE_TTL_MS).toISOString();
  await db.batch([
    db.prepare('DELETE FROM together_invites WHERE pair_id = ? AND used_at IS NULL').bind(pairId),
    db
      .prepare(
        `INSERT INTO together_invites (code_hash, pair_id, created_by, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(await hashDeviceToken(code), pairId, userId, new Date(now).toISOString(), expiresAt),
  ]);
  return { code, expiresAt };
}

function refuseFull(): never {
  throw refuse('full', 'Budget together already has two people');
}

/**
 * Takes an invite: once, before it expires, into a pair that still has room. Someone already
 * sharing pots must leave first; a pair of one with nothing in it yet is let go.
 */
export async function acceptInvite(
  db: D1Database,
  userId: string,
  code: string,
  now = Date.now(),
): Promise<void> {
  if (!inviteCodePattern.test(code)) throw new ApiError('not_found', 'No such invite');
  const hash = await hashDeviceToken(code);
  const invite = await db
    .prepare(
      'SELECT pair_id, created_by, expires_at, used_at FROM together_invites WHERE code_hash = ?',
    )
    .bind(hash)
    .first<{ pair_id: string; created_by: string; expires_at: string; used_at: string | null }>();
  if (invite === null) throw new ApiError('not_found', 'No such invite');
  if (invite.created_by === userId) throw refuse('own', 'This is your own invite');
  if (invite.used_at !== null) throw refuse('used', 'This invite has been used');
  if (Date.parse(invite.expires_at) <= now) throw refuse('expired', 'This invite has expired');

  const mine = await pairOf(db, userId);
  if (mine === invite.pair_id) return;
  if (mine !== null) {
    const pots = await db
      .prepare('SELECT COUNT(*) AS n FROM together_pots WHERE pair_id = ?')
      .bind(mine)
      .first<{ n: number }>();
    if ((await memberCount(db, mine)) > 1 || (pots?.n ?? 0) > 0) {
      throw refuse('paired', 'Leave Budget together first');
    }
    await dissolvePair(db, mine);
  }
  if ((await memberCount(db, invite.pair_id)) >= 2) refuseFull();

  // Taken and joined in one transaction: the invite is marked only while it is still free, and
  // the person joins only through the mark they made.
  const at = new Date(now).toISOString();
  const [, joined] = await db.batch([
    db
      .prepare(
        `UPDATE together_invites SET used_at = ?1, used_by = ?2
         WHERE code_hash = ?3 AND used_at IS NULL AND expires_at > ?1
           AND (SELECT COUNT(*) FROM together_members m WHERE m.pair_id = together_invites.pair_id) < 2`,
      )
      .bind(at, userId, hash),
    db
      .prepare(
        `INSERT INTO together_members (pair_id, user_id, joined_at)
         SELECT pair_id, ?2, ?1 FROM together_invites
         WHERE code_hash = ?3 AND used_by = ?2 AND used_at = ?1`,
      )
      .bind(at, userId, hash),
  ]);
  if ((joined?.meta.changes ?? 0) !== 1) throw refuse('used', 'This invite has been used');
}
