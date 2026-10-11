import { z } from 'zod';

import { DEFAULT_LOOK, LOOK_IDS, lookById, type LookConfig, type LookId } from '@6pm/theme';

import type { SqlDatabase } from './table';

/** One look's saved settings: only what the user changed, the rest is the look's defaults. */
export type LookConfigPatch = Partial<LookConfig>;
export type LookConfigs = Readonly<Partial<Record<LookId, LookConfigPatch>>>;

/** The look the app wears and each look's own settings. Kept as one JSON setting. */
export interface LookSettings {
  readonly look: LookId;
  readonly config: LookConfigs;
}

export const DEFAULT_LOOK_SETTINGS: LookSettings = { look: DEFAULT_LOOK, config: {} };

const lookSettingsSchema = z.object({
  look: z.enum(LOOK_IDS),
  config: z.partialRecord(
    z.enum(LOOK_IDS),
    z.record(z.string(), z.union([z.number(), z.boolean()])),
  ),
});

/** The settings key under which the look is kept. */
export const LOOK_KEY = 'look';

/**
 * Cleans one look's settings to what the look has: its variant in range, the intensity in 0–100
 * and its two switches. Anything else is dropped, so a look that changes between versions never
 * leaves a stale value behind.
 */
export function sanitizeConfig(
  look: LookId,
  raw: Readonly<Record<string, unknown>>,
): LookConfigPatch {
  const def = lookById(look);
  const clean: Record<string, number | boolean> = {};
  const { v, k } = raw;
  if (typeof v === 'number' && Number.isFinite(v)) {
    clean['v'] = Math.min(def.variants.length - 1, Math.max(0, Math.round(v)));
  }
  if (typeof k === 'number' && Number.isFinite(k)) {
    clean['k'] = Math.min(100, Math.max(0, Math.round(k)));
  }
  for (const control of def.ctl) {
    const value = raw[control.key];
    if (typeof value === 'boolean') clean[control.key] = value;
  }
  return clean;
}

function sanitizeAll(
  configs: Readonly<Partial<Record<LookId, Record<string, unknown>>>>,
): LookConfigs {
  const clean: Partial<Record<LookId, LookConfigPatch>> = {};
  for (const look of LOOK_IDS) {
    const raw = configs[look];
    if (raw) clean[look] = sanitizeConfig(look, raw);
  }
  return clean;
}

/** Reads the stored text; anything missing or unreadable is the default look with its defaults. */
export function parseLookSettings(raw: string | null | undefined): LookSettings {
  if (raw === null || raw === undefined) return DEFAULT_LOOK_SETTINGS;
  try {
    const parsed = lookSettingsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return DEFAULT_LOOK_SETTINGS;
    return { look: parsed.data.look, config: sanitizeAll(parsed.data.config) };
  } catch {
    return DEFAULT_LOOK_SETTINGS;
  }
}

export async function readLookSettings(db: SqlDatabase): Promise<LookSettings> {
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    LOOK_KEY,
  ]);
  return parseLookSettings(rows[0]?.value);
}

export async function writeLookSettings(db: SqlDatabase, settings: LookSettings): Promise<void> {
  const checked = lookSettingsSchema.parse({
    look: settings.look,
    config: sanitizeAll(settings.config),
  });
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    LOOK_KEY,
    JSON.stringify(checked),
  ]);
}

/** What the screens read: the saved settings, and the look being tried on (never saved). */
export interface LookSnapshot extends LookSettings {
  readonly tryOn: LookId | null;
}

export interface LookSettingsStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): LookSnapshot;
  /**
   * Wears a look, unless `canUse` says it is not the customer's. Returns whether it was set. A
   * look that is set ends any try-on.
   */
  setLook(look: LookId, canUse: (look: LookId) => boolean): boolean;
  /**
   * Changes one look's variant, intensity or switches. A slider drag passes `persist: false`
   * while it moves and saves once when it lets go.
   */
  setConfig(look: LookId, patch: LookConfigPatch, options?: { readonly persist?: boolean }): void;
  /** Wears a look on screen for as long as it is set, without saving it or checking ownership. */
  setTryOn(look: LookId | null): void;
  /** Reads the database again (after everything was deleted). Ends any try-on. */
  reload(): Promise<void>;
}

/**
 * The look settings, in memory and on disk. Writes go out one after another, each carrying the
 * latest state, so a quick run of changes saves in order and the last one wins.
 */
export function createLookSettingsStore(
  db: SqlDatabase,
  initial: LookSettings,
  onError: (error: unknown) => void = (error) => console.error('Saving the look failed', error),
): LookSettingsStore {
  const listeners = new Set<() => void>();
  let snapshot: LookSnapshot = { ...initial, tryOn: null };
  let queue: Promise<void> = Promise.resolve();

  const publish = (next: LookSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const persist = () => {
    queue = queue
      .then(() => writeLookSettings(db, { look: snapshot.look, config: snapshot.config }))
      .catch(onError);
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    setLook: (look, canUse) => {
      if (!canUse(look)) return false;
      publish({ ...snapshot, look, tryOn: null });
      persist();
      return true;
    },
    setConfig: (look, patch, options) => {
      const config = sanitizeConfig(look, { ...snapshot.config[look], ...patch });
      publish({ ...snapshot, config: { ...snapshot.config, [look]: config } });
      if (options?.persist !== false) persist();
    },
    setTryOn: (look) => {
      if (snapshot.tryOn !== look) publish({ ...snapshot, tryOn: look });
    },
    reload: async () => {
      await queue;
      publish({ ...(await readLookSettings(db)), tryOn: null });
    },
  };
}
