import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { readAiMode, writeAiMode, type AiMode } from './ai-mode';
import { shareAiMode } from './ai-mode-share';
import { applyAiModeToCrashReports } from './crash-reports';

type Settings = Pick<SQLiteDatabase, 'getFirstSync' | 'runSync'>;

const listeners = new Set<() => void>();
let changes = 0;
let cached: { readonly db: object; readonly changes: number; readonly mode: AiMode } | null = null;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** What follows the mode outside the database: the extensions' copy and crash reports. */
export function applyAiMode(mode: AiMode): void {
  shareAiMode(mode);
  applyAiModeToCrashReports(mode);
}

/**
 * Chooses where 6pm's AI runs: kept in the settings, copied to the App Group for the extensions,
 * crash reports turned on or off, and every screen reading `useAiMode` updated.
 */
export function setAiMode(db: Settings, mode: AiMode): void {
  writeAiMode(db, mode);
  applyAiMode(mode);
  changes += 1;
  for (const listener of listeners) listener();
}

/** The AI mode now, following `setAiMode`. */
export function useAiMode(): AiMode {
  const db = useSQLiteContext();
  const snapshot = useCallback(() => {
    if (cached?.db !== db || cached.changes !== changes) {
      cached = { db, changes, mode: readAiMode(db) };
    }
    return cached.mode;
  }, [db]);
  return useSyncExternalStore(subscribe, snapshot);
}

/**
 * Once the database is open, the mode it holds is applied: the App Group copy is written again
 * (an install restored from a backup, or a write that failed) and crash reports follow it.
 */
export function AiModeSync(): null {
  const mode = useAiMode();
  useEffect(() => {
    applyAiMode(mode);
  }, [mode]);
  return null;
}
