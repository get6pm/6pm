import type { SharedPot, TogetherMember, TogetherState } from '@6pm/domain';

import type { Bindings } from '../env';
import { ApiError } from '../errors';
import type { RouteContext } from '../route';
import { revokeAppleToken } from './apple-tokens';

/**
 * Budget together in D1. Every read and write goes through the person the calling device is
 * signed in as, and through that person's pair: nothing here takes a pair id from the request.
 */

export interface TogetherUser {
  readonly id: string;
  readonly name: string | null;
}

/** The person this device is signed in as, or null. */
export async function userOfDevice(
  db: D1Database,
  deviceHash: string,
): Promise<TogetherUser | null> {
  return db
    .prepare(
      `SELECT u.id AS id, u.name AS name FROM together_devices d
       JOIN together_users u ON u.id = d.user_id WHERE d.device_hash = ?`,
    )
    .bind(deviceHash)
    .first<TogetherUser>();
}

/** The signed-in person behind a request, or `forbidden` with the reason `signed_out`. */
export async function requireUser(c: RouteContext): Promise<TogetherUser> {
  const user = await userOfDevice(c.env.DB, c.var.device.hash);
  if (user === null) {
    throw new ApiError('forbidden', 'Sign in with Apple first', { reason: 'signed_out' });
  }
  return user;
}

export async function pairOf(db: D1Database, userId: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT pair_id FROM together_members WHERE user_id = ?')
    .bind(userId)
    .first<{ pair_id: string }>();
  return row?.pair_id ?? null;
}

/** The person's pair, or `not_found` when they are in none. */
export async function requirePair(db: D1Database, userId: string): Promise<string> {
  const pair = await pairOf(db, userId);
  if (pair === null) throw new ApiError('not_found', 'Not in Budget together');
  return pair;
}

/** The person's pair, made with them alone in it when they are in none yet. */
export async function ensurePair(db: D1Database, userId: string): Promise<string> {
  const existing = await pairOf(db, userId);
  if (existing !== null) return existing;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await db.batch([
      db.prepare('INSERT INTO together_pairs (id, created_at) VALUES (?, ?)').bind(id, now),
      db
        .prepare('INSERT INTO together_members (pair_id, user_id, joined_at) VALUES (?, ?, ?)')
        .bind(id, userId, now),
    ]);
  } catch (error) {
    // Two requests made the person's pair at once: the other one won, and this batch rolled back.
    if (!isUniqueViolation(error)) throw error;
    const won = await pairOf(db, userId);
    if (won === null) throw error;
    return won;
  }
  return id;
}

/** Whether D1 refused a write for a UNIQUE or PRIMARY KEY clash. */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = error.cause instanceof Error ? error.cause.message : '';
  const text = `${error.message} ${cause}`;
  return /UNIQUE constraint failed|PRIMARY KEY/i.test(text);
}

interface PotRow {
  id: string;
  name: string;
  icon: string;
  hue: number;
  goal: number;
  needed_by: string | null;
  created_by: string;
  created_at: string;
}

interface ContributionRow {
  id: string;
  pot_id: string;
  user_id: string;
  amount: number;
  added_at: string;
}

/** Everything the person can see: who they are, and their pair with its pots, if any. */
export async function readState(db: D1Database, user: TogetherUser): Promise<TogetherState> {
  const me: TogetherMember = { id: user.id, name: user.name };
  const pairId = await pairOf(db, user.id);
  if (pairId === null) return { me, pair: null };
  const [members, pots, contributions] = await db.batch<unknown>([
    db
      .prepare(
        `SELECT u.id AS id, u.name AS name FROM together_members m
         JOIN together_users u ON u.id = m.user_id WHERE m.pair_id = ? ORDER BY m.joined_at`,
      )
      .bind(pairId),
    db
      .prepare(
        `SELECT id, name, icon, hue, goal, needed_by, created_by, created_at FROM together_pots
         WHERE pair_id = ? ORDER BY created_at, id`,
      )
      .bind(pairId),
    db
      .prepare(
        `SELECT c.id, c.pot_id, c.user_id, c.amount, c.added_at FROM together_contributions c
         JOIN together_pots p ON p.id = c.pot_id WHERE p.pair_id = ? ORDER BY c.added_at, c.id`,
      )
      .bind(pairId),
  ]);
  const byPot = new Map<string, SharedPot['contributions'][number][]>();
  for (const c of (contributions?.results ?? []) as ContributionRow[]) {
    const list = byPot.get(c.pot_id) ?? [];
    list.push({ id: c.id, memberId: c.user_id, amount: c.amount, addedAt: c.added_at });
    byPot.set(c.pot_id, list);
  }
  return {
    me,
    pair: {
      id: pairId,
      members: (members?.results ?? []) as TogetherMember[],
      pots: ((pots?.results ?? []) as PotRow[]).map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        hue: p.hue,
        goal: p.goal,
        neededBy: p.needed_by,
        createdBy: p.created_by,
        createdAt: p.created_at,
        contributions: byPot.get(p.id) ?? [],
      })),
    },
  };
}

/** Deletes a pair and everything under it: members, invites, pots and contributions. */
export async function dissolvePair(db: D1Database, pairId: string): Promise<void> {
  await db.prepare('DELETE FROM together_pairs WHERE id = ?').bind(pairId).run();
}

/**
 * Deletes a person: their pair goes too (a pair of one is no pair), then every device link and
 * the person. Apple is asked to revoke the app's access first; that failing never stops it.
 */
export async function deleteUser(env: Bindings, userId: string): Promise<void> {
  const db = env.DB;
  const row = await db
    .prepare('SELECT apple_refresh_token, apple_client_id FROM together_users WHERE id = ?')
    .bind(userId)
    .first<{ apple_refresh_token: string | null; apple_client_id: string | null }>();
  if (row === null) return;
  if (row.apple_refresh_token !== null && row.apple_client_id !== null) {
    await revokeAppleToken(env, row.apple_client_id, row.apple_refresh_token);
  }
  const pairId = await pairOf(db, userId);
  if (pairId !== null) await dissolvePair(db, pairId);
  await db.prepare('DELETE FROM together_users WHERE id = ?').bind(userId).run();
}

/** A pot of the person's own pair, or `not_found`: another pair's pot is never revealed. */
export async function requirePot(db: D1Database, pairId: string, potId: string): Promise<void> {
  const row = await db
    .prepare('SELECT 1 AS ok FROM together_pots WHERE id = ? AND pair_id = ?')
    .bind(potId, pairId)
    .first();
  if (row === null) throw new ApiError('not_found', 'No such pot');
}

/** Answers with the whole shared copy, as every Budget together route does. */
export async function answerState(c: RouteContext, user: TogetherUser): Promise<Response> {
  c.header('Cache-Control', 'no-store');
  return c.json(await readState(c.env.DB, user));
}
