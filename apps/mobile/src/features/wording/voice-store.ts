import type { SQLiteDatabase } from 'expo-sqlite';

import { parseVoice, type CompanionVoice } from './companion-voice';

const KEY = 'companion.voice';

let cached: CompanionVoice | null = null;

/** The companion's memory, read once from settings and then kept in memory for every screen. */
export function readVoice(db: Pick<SQLiteDatabase, 'getFirstSync'>): CompanionVoice {
  cached ??= parseVoice(
    db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [KEY])?.value,
  );
  return cached;
}

/** Keeps the memory for every screen now and writes it to settings in the background. */
export function writeVoice(db: Pick<SQLiteDatabase, 'runAsync'>, next: CompanionVoice): void {
  if (next === cached) return;
  cached = next;
  db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    KEY,
    JSON.stringify(next),
  ]).catch(() => {
    // Losing the memory only means a line may come round again sooner.
  });
}

/** Forgets the in-memory copy, after "Delete all data" or a restore. */
export function forgetVoice(): void {
  cached = null;
}
