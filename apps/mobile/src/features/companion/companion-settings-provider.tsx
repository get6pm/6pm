import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import {
  COMPANION_KEY,
  createCompanionSettingsStore,
  parseCompanionSettings,
  type CompanionSettings,
  type CompanionSettingsStore,
} from '../../data/companion-settings';

const CompanionSettingsContext = createContext<CompanionSettingsStore | null>(null);

/**
 * The companion picked in Settings, read synchronously at launch (like the look) so the first
 * frame already shows it.
 */
export function CompanionSettingsProvider({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const store = useMemo(
    () =>
      createCompanionSettingsStore(
        db,
        parseCompanionSettings(
          db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            COMPANION_KEY,
          ])?.value,
        ),
      ),
    [db],
  );
  return <CompanionSettingsContext value={store}>{children}</CompanionSettingsContext>;
}

/** The store itself, for the writes: pick a companion, let the icon follow it. */
export function useCompanionSettingsStore(): CompanionSettingsStore {
  const store = use(CompanionSettingsContext);
  if (!store) throw new Error('Companion hooks need a CompanionSettingsProvider above them');
  return store;
}

export function useCompanionSettings(): CompanionSettings {
  const store = useCompanionSettingsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
  );
}
