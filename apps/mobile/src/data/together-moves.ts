import { moneyDayOf, payCycleOn, type LocalDate, type Payday } from '@6pm/domain';

import type { SqlDatabase } from './table';

/** One contribution the person made to a shared pot, as this phone keeps it. */
export interface TogetherMove {
  readonly id: string;
  readonly potId: string;
  readonly potName: string;
  readonly amount: number;
  /** When it was added (ISO instant). */
  readonly at: string;
}

/**
 * Keeps the contributions this phone has not kept yet, each filed under the pay cycle of the
 * money day it was added on. Resolves to how many were new, so the caller knows to recount.
 */
export async function keepTogetherMoves(
  db: SqlDatabase,
  moves: readonly TogetherMove[],
  payday: Payday,
): Promise<number> {
  if (moves.length === 0) return 0;
  const known = new Set(
    (await db.getAllAsync<{ id: string }>('SELECT id FROM together_moves', [])).map((r) => r.id),
  );
  const fresh = moves.filter((m) => !known.has(m.id));
  if (fresh.length === 0) return 0;
  await db.withTransactionAsync(async () => {
    for (const m of fresh) {
      const cycle = payCycleOn(moneyDayOf(new Date(m.at)), payday).start;
      await db.runAsync(
        `INSERT OR IGNORE INTO together_moves (id, pot_id, pot_name, amount, cycle, at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [m.id, m.potId, m.potName, m.amount, cycle, m.at],
      );
    }
  });
  return fresh.length;
}

/**
 * Lines the record up with the server's copy. The person's contributions not yet kept are
 * written; a kept one whose pot is still shared but that the server no longer lists was taken
 * back (here with a lost answer, or on another device) and is dropped. A pot that is gone keeps
 * its history, and so does everything after leaving, when no pot is live. Resolves to how many
 * rows changed, so the caller knows to recount.
 */
export async function reconcileTogetherMoves(
  db: SqlDatabase,
  own: readonly TogetherMove[],
  livePotIds: readonly string[],
  payday: Payday,
): Promise<number> {
  const added = await keepTogetherMoves(db, own, payday);
  if (livePotIds.length === 0) return added;
  const kept = new Set(own.map((m) => m.id));
  const live = livePotIds.map(() => '?').join(', ');
  const stale = (
    await db.getAllAsync<{ id: string }>(
      `SELECT id FROM together_moves WHERE pot_id IN (${live})`,
      [...livePotIds],
    )
  ).filter((r) => !kept.has(r.id));
  if (stale.length === 0) return added;
  await db.withTransactionAsync(async () => {
    for (const { id } of stale) await db.runAsync('DELETE FROM together_moves WHERE id = ?', [id]);
  });
  return added + stale.length;
}

/** What the person put into shared pots in one pay cycle: it counts like a pot top-up. */
export async function togetherTopUps(db: SqlDatabase, cycleStart: LocalDate): Promise<number> {
  const rows = await db.getAllAsync<{ total: number | null }>(
    'SELECT SUM(amount) AS total FROM together_moves WHERE cycle = ?',
    [cycleStart],
  );
  return rows[0]?.total ?? 0;
}

export interface KeptPot {
  readonly potName: string;
  readonly amount: number;
}

/** Everything the person ever put into shared pots, added up per pot name, largest first. */
export async function keptTogetherMoves(db: SqlDatabase): Promise<KeptPot[]> {
  const rows = await db.getAllAsync<{ pot_name: string; total: number }>(
    `SELECT pot_name, SUM(amount) AS total FROM together_moves
     GROUP BY pot_id, pot_name ORDER BY total DESC`,
    [],
  );
  return rows.map((r) => ({ potName: r.pot_name, amount: r.total }));
}
