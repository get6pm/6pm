import {
  dueSetAsides,
  moneyDayOf,
  type Currency,
  type LocalDate,
  type Payday,
  type PotMove,
  type PotMoveKind,
  type PotRow,
} from '@6pm/domain';

import type { MoneyStore } from './money-store';
import type { SqlDatabase } from './table';

interface MoveColumns {
  pot_id: string;
  amount: number;
  kind: string;
  cycle: string;
}

const KINDS: readonly string[] = ['setAside', 'topUp', 'spent', 'opening'] satisfies PotMoveKind[];

/** Every move of every pot, as the domain reads them. A row of an unknown kind is left out. */
export async function readPotMoves(db: SqlDatabase): Promise<PotMove[]> {
  const rows = await db.getAllAsync<MoveColumns>(
    'SELECT pot_id, amount, kind, cycle FROM pot_moves',
    [],
  );
  return rows
    .filter((r) => KINDS.includes(r.kind))
    .map((r) => ({
      potId: r.pot_id,
      kind: r.kind as PotMoveKind,
      cycle: r.cycle,
      amount: r.amount,
    }));
}

/** One set-aside per pot and cycle: the id makes a second write of the same cycle a no-op. */
function setAsideId(potId: string, cycle: LocalDate): string {
  return `set-aside:${potId}:${cycle}`;
}

/**
 * Writes the set-asides the pay cycles have made due, once each, and returns them as moves. Runs
 * on every load, so a relaunch, a missed day or a skipped cycle all catch up the same way and a
 * second run finds nothing to write.
 */
export async function recordDueSetAsides(
  db: SqlDatabase,
  input: {
    readonly pots: readonly PotRow[];
    readonly moves: readonly PotMove[];
    readonly futureYou: number;
    readonly futureYouFrom: LocalDate | null;
    readonly payday: Payday;
    readonly today: LocalDate;
    readonly currency: Currency;
  },
): Promise<PotMove[]> {
  const due = dueSetAsides({ ...input, dayOf: (instant) => moneyDayOf(new Date(instant)) });
  if (due.length === 0) return [];
  const at = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const record of due) {
      await db.runAsync(
        `INSERT OR IGNORE INTO pot_moves (id, pot_id, amount, kind, cycle, at)
         VALUES (?, ?, ?, 'setAside', ?, ?)`,
        [setAsideId(record.potId, record.cycle), record.potId, record.amount, record.cycle, at],
      );
    }
  });
  return due.map((d) => ({ potId: d.potId, kind: 'setAside', cycle: d.cycle, amount: d.amount }));
}

/**
 * Sets what a pot already held before 6pm: its one opening move, replaced on every edit and
 * removed at 0. It is filed in the cycle it was typed in, but counts as saved before every cycle.
 */
export async function writeOpening(
  db: SqlDatabase,
  potId: string,
  amount: number,
  cycle: LocalDate,
): Promise<void> {
  const id = `opening:${potId}`;
  const held = Math.max(0, Math.round(amount));
  if (held === 0) {
    await db.runAsync('DELETE FROM pot_moves WHERE id = ?', [id]);
    return;
  }
  await db.runAsync(
    `INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at) VALUES (?, ?, ?, 'opening', ?, ?)
     ON CONFLICT (id) DO UPDATE SET amount = excluded.amount, at = excluded.at`,
    [id, potId, held, cycle, new Date().toISOString()],
  );
}

/**
 * Forgets one cycle's set-aside of a pot so the next load works it out again from the pot as it
 * is now: an edit to the pot (or to Future you, for a goal) reaches this cycle, never an earlier one.
 */
export async function clearCycleSetAside(
  db: SqlDatabase,
  potId: string,
  cycle: LocalDate,
): Promise<void> {
  await db.runAsync("DELETE FROM pot_moves WHERE pot_id = ? AND kind = 'setAside' AND cycle = ?", [
    potId,
    cycle,
  ]);
}

/** Moves the current cycle's records to a new start when the payday changes, so none is lost. */
export async function moveCycleRecords(
  db: SqlDatabase,
  from: LocalDate,
  to: LocalDate,
): Promise<void> {
  if (from === to) return;
  await db.runAsync('UPDATE pot_moves SET cycle = ? WHERE cycle = ?', [to, from]);
  await db.runAsync('UPDATE together_moves SET cycle = ? WHERE cycle = ?', [to, from]);
  await db.runAsync('UPDATE bills SET paid_cycle = ? WHERE paid_cycle = ?', [to, from]);
  await db.runAsync('UPDATE bills SET asked_cycle = ? WHERE asked_cycle = ?', [to, from]);
}

/** Top-ups this pay cycle, split by where they went: the river shows each under its own colour. */
export interface CycleTopUps {
  readonly goal: number;
  readonly occasion: number;
}

/** This cycle's top-ups by the kind of pot they went into. */
export async function readCycleTopUps(store: MoneyStore): Promise<CycleTopUps> {
  const rows = await store.db.getAllAsync<{ kind: string; total: number }>(
    `SELECT p.kind AS kind, SUM(m.amount) AS total FROM pot_moves m JOIN pots p ON p.id = m.pot_id
     WHERE m.kind = 'topUp' AND m.cycle = ? AND p.archived_at IS NULL GROUP BY p.kind`,
    [store.getSnapshot().cycle.start],
  );
  const of = (kind: string) => rows.find((r) => r.kind === kind)?.total ?? 0;
  return { goal: of('goal'), occasion: of('occasion') };
}
