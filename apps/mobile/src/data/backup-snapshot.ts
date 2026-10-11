import {
  BACKUP_SETTING_KEYS,
  BACKUP_SNAPSHOT_VERSION,
  backupItemCount,
  type BackupSettingKey,
  type BackupSnapshot,
  type PotMoveRow,
  type SpendSightingRow,
} from '@6pm/domain';

import { openMoneyTables } from './money-tables';
import { planSettingsSchema } from './plan-settings';
import type { SqlDatabase } from './table';

/** Children before parents, so the foreign keys never see an orphan while a restore clears. */
const CLEARED_IN_ORDER = [
  'spend_sightings',
  'pot_moves',
  'spends',
  'merchant_rules',
  'bills',
  'pots',
  'categories',
  'closed_days',
] as const;

/** Why a snapshot cannot be put back. Nothing has been written when this is thrown. */
export class SnapshotRefused extends Error {
  constructor(readonly why: string) {
    super(`The snapshot cannot be restored: ${why}`);
    this.name = 'SnapshotRefused';
  }
}

const keyList = BACKUP_SETTING_KEYS.map(() => '?').join(', ');

async function readSettings(db: SqlDatabase): Promise<BackupSnapshot['settings']> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (${keyList})`,
    [...BACKUP_SETTING_KEYS],
  );
  const settings: { -readonly [K in BackupSettingKey]?: string } = {};
  for (const { key, value } of rows) settings[key as BackupSettingKey] = value;
  return settings;
}

/**
 * Every table the app keeps, as plain rows. Rows that others point at are read last, so a row
 * written while this runs never points at one that was missed: spends before their categories,
 * and pot moves before their pots.
 */
export async function buildSnapshot(db: SqlDatabase, takenAt: string): Promise<BackupSnapshot> {
  const tables = openMoneyTables(db);
  const spends = await tables.spends.all();
  const sightings = await db.getAllAsync<{
    spend_id: string;
    source: SpendSightingRow['source'];
    seen_at: string;
    detail: string | null;
  }>(
    'SELECT spend_id, source, seen_at, detail FROM spend_sightings ORDER BY spend_id, source, seen_at',
    [],
  );
  const merchantRules = await tables.rules.all();
  const moves = await db.getAllAsync<{
    id: string;
    pot_id: string;
    amount: number;
    kind: PotMoveRow['kind'];
    cycle: string;
    at: string;
  }>('SELECT id, pot_id, amount, kind, cycle, at FROM pot_moves ORDER BY id', []);
  const [categories, bills, pots, closedDays, settings] = await Promise.all([
    tables.categories.all(),
    tables.bills.all(),
    tables.pots.all(),
    tables.closedDays.all(),
    readSettings(db),
  ]);
  const spendIds = new Set(spends.map((spend) => spend.id));
  const potIds = new Set(pots.map((pot) => pot.id));
  return {
    version: BACKUP_SNAPSHOT_VERSION,
    takenAt,
    settings,
    categories,
    spends,
    spendSightings: sightings
      .filter((row) => spendIds.has(row.spend_id))
      .map((row) => ({
        spendId: row.spend_id,
        source: row.source,
        seenAt: row.seen_at,
        detail: row.detail,
      })),
    merchantRules,
    bills,
    pots,
    potMoves: moves
      .filter((row) => potIds.has(row.pot_id))
      .map((row) => ({
        id: row.id,
        potId: row.pot_id,
        amount: row.amount,
        kind: row.kind,
        cycle: row.cycle,
        at: row.at,
      })),
    closedDays,
  };
}

/** The number "N items" counts, read from a phone's own database. */
export function snapshotItemCount(snapshot: BackupSnapshot): number {
  return backupItemCount(snapshot);
}

/**
 * True while nothing has been made on this phone: no month set up and no spend. Day rows and
 * categories do not count: the app can make them before the person has done anything.
 */
export async function isFreshDatabase(db: SqlDatabase): Promise<boolean> {
  const [plan] = await db.getAllAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM settings WHERE key = 'plan'",
    [],
  );
  const [spends] = await db.getAllAsync<{ n: number }>('SELECT COUNT(*) AS n FROM spends', []);
  return (plan?.n ?? 0) === 0 && (spends?.n ?? 0) === 0;
}

/** Checks the settings a snapshot carries before anything is cleared. */
function checkSettings(settings: BackupSnapshot['settings']): void {
  const { plan, wallets, look, language } = settings;
  if (plan !== undefined) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(plan);
    } catch {
      throw new SnapshotRefused('the plan is not JSON');
    }
    if (!planSettingsSchema.safeParse(parsed).success) {
      throw new SnapshotRefused('the plan does not match its contract');
    }
  }
  for (const [name, text] of [
    ['wallets', wallets],
    ['look', look],
  ] as const) {
    if (text === undefined) continue;
    try {
      JSON.parse(text);
    } catch {
      throw new SnapshotRefused(`${name} is not JSON`);
    }
  }
  if (language !== undefined && language !== 'en' && language !== 'vi') {
    throw new SnapshotRefused('the language is not one 6pm speaks');
  }
}

/**
 * Replaces everything the app keeps with the snapshot, in one transaction: a snapshot that fails
 * half way leaves the phone exactly as it was. Settings that belong to this phone (what the store
 * said about purchases, where backup stands) are left alone; the four a snapshot carries are
 * replaced, and removed when the snapshot has none.
 */
export async function restoreSnapshot(db: SqlDatabase, snapshot: BackupSnapshot): Promise<void> {
  checkSettings(snapshot.settings);
  const tables = openMoneyTables(db);
  await db.withTransactionAsync(async () => {
    for (const table of CLEARED_IN_ORDER) await db.runAsync(`DELETE FROM ${table}`, []);
    await db.runAsync(`DELETE FROM settings WHERE key IN (${keyList})`, [...BACKUP_SETTING_KEYS]);

    for (const [key, value] of Object.entries(snapshot.settings)) {
      if (value !== undefined) {
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
          key,
          value,
        ]);
      }
    }
    for (const row of snapshot.categories) await tables.categories.put(row);
    for (const row of snapshot.spends) await tables.spends.put(row);
    for (const row of snapshot.spendSightings) {
      await db.runAsync(
        'INSERT OR REPLACE INTO spend_sightings (spend_id, source, seen_at, detail) VALUES (?, ?, ?, ?)',
        [row.spendId, row.source, row.seenAt, row.detail],
      );
    }
    for (const row of snapshot.merchantRules) await tables.rules.put(row);
    for (const row of snapshot.bills) await tables.bills.put(row);
    for (const row of snapshot.pots) await tables.pots.put(row);
    for (const row of snapshot.potMoves) {
      await db.runAsync(
        'INSERT OR REPLACE INTO pot_moves (id, pot_id, amount, kind, cycle, at) VALUES (?, ?, ?, ?, ?, ?)',
        [row.id, row.potId, row.amount, row.kind, row.cycle, row.at],
      );
    }
    for (const row of snapshot.closedDays) await tables.closedDays.put(row);
  });
}
