import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import type { LookConfig, LookId } from '@6pm/theme';

import {
  LOOK_KEY,
  createLookSettingsStore,
  parseLookSettings,
  type LookSettingsStore,
  type LookSnapshot,
} from '../../data/look-settings';
import { resolveLook } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';

const LookSettingsContext = createContext<LookSettingsStore | null>(null);

/**
 * The chosen look and each look's settings, read synchronously at launch (like the language) so
 * the first frame is already in the right look. It sits above the theme.
 */
export function LookSettingsProvider({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const store = useMemo(
    () =>
      createLookSettingsStore(
        db,
        parseLookSettings(
          db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [LOOK_KEY])
            ?.value,
        ),
      ),
    [db],
  );
  return <LookSettingsContext value={store}>{children}</LookSettingsContext>;
}

/** The store itself, for the writes: wear a look, change its settings, try one on. */
export function useLookSettingsStore(): LookSettingsStore {
  const store = use(LookSettingsContext);
  if (!store) throw new Error('Look hooks need a LookSettingsProvider above them');
  return store;
}

export function useLookSettings(): LookSnapshot {
  const store = useLookSettingsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
  );
}

/**
 * The look the whole app wears, as the root `ThemeProvider`'s props: the look being tried on, else
 * the chosen look (Golden Hour when it is no longer the customer's), with that look's own
 * settings. `config` is left out until the look has any.
 */
export function useThemeLook(): { readonly look: LookId; readonly config?: Partial<LookConfig> } {
  const { look, config, tryOn } = useLookSettings();
  const { customer } = useEntitlement();
  const worn = tryOn ?? resolveLook(look, customer);
  const own = config[worn];
  return useMemo(() => (own ? { look: worn, config: own } : { look: worn }), [worn, own]);
}
