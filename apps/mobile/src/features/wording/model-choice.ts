import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Which model words first: Claude on the server, or Apple's model on this iPhone. The other is the
 * fallback, and the catalogue is always last. Set on the dev Tools screen while the team compares.
 */
export type ModelChoice = 'server' | 'device';

const KEY = 'ai.model';

export function readModelChoice(db: Pick<SQLiteDatabase, 'getFirstSync'>): ModelChoice {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [KEY]);
  return row?.value === 'device' ? 'device' : 'server';
}

export function writeModelChoice(db: Pick<SQLiteDatabase, 'runSync'>, choice: ModelChoice): void {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [KEY, choice]);
}
