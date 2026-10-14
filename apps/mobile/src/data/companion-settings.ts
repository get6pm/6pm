import { COMPANION_FORMS, isMaxForm, type CompanionForm } from '../ui/companion/companion-mood';
import type { SqlDatabase } from './table';

/** The companion the person chose and whether the app icon follows it. Kept as one JSON setting. */
export interface CompanionSettings {
  /** The form picked in Settings; null until one is picked, when members wear the Max form. */
  readonly chosen: CompanionForm | null;
  /** The last free form picked: what is worn when a Max-only choice is no longer theirs. */
  readonly lastFree: CompanionForm;
  /** The Home Screen icon shows the companion worn. */
  readonly icon: boolean;
}

export const DEFAULT_COMPANION_SETTINGS: CompanionSettings = {
  chosen: null,
  lastFree: 'sun',
  icon: false,
};

/** The settings key under which the companion is kept. */
export const COMPANION_KEY = 'companion';

function formOf(raw: unknown): CompanionForm | null {
  return COMPANION_FORMS.find((form) => form === raw) ?? null;
}

/**
 * Reads the stored text field by field: a form this version does not know (or text that is not
 * the shape at all) falls back to the default, so a newer or damaged value never breaks launch.
 */
export function parseCompanionSettings(raw: string | null | undefined): CompanionSettings {
  if (raw === null || raw === undefined) return DEFAULT_COMPANION_SETTINGS;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return DEFAULT_COMPANION_SETTINGS;
  }
  if (typeof value !== 'object' || value === null) return DEFAULT_COMPANION_SETTINGS;
  const { chosen, lastFree, icon } = value as Record<string, unknown>;
  const free = formOf(lastFree);
  return {
    chosen: formOf(chosen),
    lastFree: free !== null && !isMaxForm(free) ? free : 'sun',
    icon: icon === true,
  };
}

/** The settings after picking `form`: a free pick is also remembered as the one to fall back to. */
export function chooseCompanion(
  settings: CompanionSettings,
  form: CompanionForm,
): CompanionSettings {
  return { ...settings, chosen: form, lastFree: isMaxForm(form) ? settings.lastFree : form };
}

export async function readCompanionSettings(db: SqlDatabase): Promise<CompanionSettings> {
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    COMPANION_KEY,
  ]);
  return parseCompanionSettings(rows[0]?.value);
}

export async function writeCompanionSettings(
  db: SqlDatabase,
  settings: CompanionSettings,
): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    COMPANION_KEY,
    JSON.stringify(settings),
  ]);
}

export interface CompanionSettingsStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): CompanionSettings;
  /** Wears `form`, unless `canUse` says it is not the customer's. Returns whether it was set. */
  choose(form: CompanionForm, canUse: (form: CompanionForm) => boolean): boolean;
  /** Lets the app icon follow the companion, or go back to the sun. */
  setIcon(icon: boolean): void;
  /** Reads the database again (after everything was deleted). */
  reload(): Promise<void>;
}

/**
 * The companion settings, in memory and on disk. Writes go out one after another, each carrying
 * the latest state, so a quick run of picks saves in order and the last one wins.
 */
export function createCompanionSettingsStore(
  db: SqlDatabase,
  initial: CompanionSettings,
  onError: (error: unknown) => void = (error) =>
    console.error('Saving the companion failed', error),
): CompanionSettingsStore {
  const listeners = new Set<() => void>();
  let snapshot = initial;
  let queue: Promise<void> = Promise.resolve();

  const publish = (next: CompanionSettings) => {
    snapshot = next;
    for (const listener of listeners) listener();
    queue = queue.then(() => writeCompanionSettings(db, snapshot)).catch(onError);
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    choose: (form, canUse) => {
      if (!canUse(form)) return false;
      publish(chooseCompanion(snapshot, form));
      return true;
    },
    setIcon: (icon) => {
      if (snapshot.icon !== icon) publish({ ...snapshot, icon });
    },
    reload: async () => {
      await queue;
      snapshot = await readCompanionSettings(db);
      for (const listener of listeners) listener();
    },
  };
}
