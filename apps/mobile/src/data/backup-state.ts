import type { SqlDatabase } from './table';

/**
 * Where backup stands on this phone, kept in the settings table under keys no snapshot carries,
 * so a restore never copies them and "Delete all data" clears them with everything else.
 */
export interface BackupLocalState {
  /** When this phone last sent a backup (ISO), or `null`. */
  readonly lastAt: string | null;
  /** The item count of that backup. */
  readonly items: number | null;
  /**
   * This phone has decided what happens to the backup already on the server: it sent one, took
   * one back, or was told to start fresh. Until then it never sends, so a new phone cannot wipe
   * a backup it has not been offered.
   */
  readonly settled: boolean;
  /** The last backup was too large for the server, so none went up. */
  readonly tooLarge: boolean;
}

const LAST_AT = 'backup.lastAt';
const ITEMS = 'backup.items';
const SETTLED = 'backup.settled';
const TOO_LARGE = 'backup.tooLarge';
const ALL = [LAST_AT, ITEMS, SETTLED, TOO_LARGE];

export interface BackupStateStore {
  read(): Promise<BackupLocalState>;
  recordUpload(at: string, items: number): Promise<void>;
  settle(): Promise<void>;
  setTooLarge(value: boolean): Promise<void>;
  clear(): Promise<void>;
}

export function createBackupStateStore(db: SqlDatabase): BackupStateStore {
  const set = (key: string, value: string) =>
    db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  return {
    read: async () => {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        `SELECT key, value FROM settings WHERE key IN (${ALL.map(() => '?').join(', ')})`,
        ALL,
      );
      const value = new Map(rows.map((row) => [row.key, row.value]));
      const items = Number(value.get(ITEMS));
      return {
        lastAt: value.get(LAST_AT) ?? null,
        items: value.has(ITEMS) && Number.isInteger(items) ? items : null,
        settled: value.has(SETTLED),
        tooLarge: value.has(TOO_LARGE),
      };
    },
    recordUpload: async (at, items) => {
      await db.withTransactionAsync(async () => {
        await set(LAST_AT, at);
        await set(ITEMS, String(items));
        await set(SETTLED, '1');
        await db.runAsync('DELETE FROM settings WHERE key = ?', [TOO_LARGE]);
      });
    },
    settle: async () => {
      await set(SETTLED, '1');
    },
    setTooLarge: async (value) => {
      if (value) await set(TOO_LARGE, '1');
      else await db.runAsync('DELETE FROM settings WHERE key = ?', [TOO_LARGE]);
    },
    clear: async () => {
      await db.runAsync(
        `DELETE FROM settings WHERE key IN (${ALL.map(() => '?').join(', ')})`,
        ALL,
      );
    },
  };
}
