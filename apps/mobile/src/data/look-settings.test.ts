import { describe, expect, it, jest } from '@jest/globals';

import { sql as createSettings } from '../db/migrations/0001-create-settings';
import { canUseLook } from '../features/purchases/entitlement';
import { FREE_CUSTOMER, type CustomerState } from '../features/purchases/purchases-port';
import {
  DEFAULT_LOOK_SETTINGS,
  LOOK_KEY,
  createLookSettingsStore,
  parseLookSettings,
  readLookSettings,
  sanitizeConfig,
  writeLookSettings,
} from './look-settings';
import type { SqlDatabase, SqlValue } from './table';

// A real SQLite database in memory, from Node's own module (see onboarding.test.ts).
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

function openDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(createSettings);
  const db: SqlDatabase = {
    getAllAsync: <T>(source: string, params: SqlValue[]) =>
      Promise.resolve(sqlite.prepare(source).all(...params) as T[]),
    runAsync: (source, params) => Promise.resolve(sqlite.prepare(source).run(...params)),
    withTransactionAsync: (task) => task(),
  };
  return { db, sqlite };
}

const owner: CustomerState = { ...FREE_CUSTOMER, ownedLooks: ['neon'] };
const canUse = (look: Parameters<typeof canUseLook>[0]) => canUseLook(look, owner);
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('reading and writing the look', () => {
  it('starts on Golden Hour with no settings', async () => {
    const { db } = openDb();
    expect(await readLookSettings(db)).toEqual(DEFAULT_LOOK_SETTINGS);
    expect(DEFAULT_LOOK_SETTINGS.look).toBe('golden');
  });

  it('round-trips the look, its variant, intensity and switches', async () => {
    const { db } = openDb();
    const settings = {
      look: 'neon' as const,
      config: { neon: { v: 1, k: 35, sign: false }, golden: { grain: false } },
    };
    await writeLookSettings(db, settings);
    expect(await readLookSettings(db)).toEqual(settings);
  });

  it('falls back to the default on text that is not the shape', () => {
    expect(parseLookSettings('not json')).toEqual(DEFAULT_LOOK_SETTINGS);
    expect(parseLookSettings('{"look":"vaporwave","config":{}}')).toEqual(DEFAULT_LOOK_SETTINGS);
    expect(parseLookSettings('{"look":"neon","config":{"neon":{"v":"two"}}}')).toEqual(
      DEFAULT_LOOK_SETTINGS,
    );
  });

  it('cleans a look’s settings to what the look has', () => {
    expect(
      sanitizeConfig('neon', { v: 9, k: 140, sign: false, flicker: 'yes', bogus: true }),
    ).toEqual({ v: 1, k: 100, sign: false });
    expect(sanitizeConfig('basic', { v: -3, k: 12.4, sun: true })).toEqual({
      v: 0,
      k: 12,
      sun: true,
    });
    expect(parseLookSettings('{"look":"neon","config":{"neon":{"v":1,"flare":true}}}')).toEqual({
      look: 'neon',
      config: { neon: { v: 1 } },
    });
  });
});

describe('the look store', () => {
  it('wears only a look that is the customer’s', async () => {
    const { db } = openDb();
    const store = createLookSettingsStore(db, DEFAULT_LOOK_SETTINGS);
    expect(store.setLook('riso', canUse)).toBe(false);
    expect(store.getSnapshot().look).toBe('golden');
    expect(store.setLook('neon', canUse)).toBe(true);
    expect(store.getSnapshot().look).toBe('neon');
    expect(store.setLook('basic', canUse)).toBe(true);
    await flush();
    expect((await readLookSettings(db)).look).toBe('basic');
  });

  it('tries a look on without saving it, and ends the try-on when one is worn', async () => {
    const { db } = openDb();
    const store = createLookSettingsStore(db, DEFAULT_LOOK_SETTINGS);
    store.setTryOn('expo');
    expect(store.getSnapshot()).toMatchObject({ look: 'golden', tryOn: 'expo' });
    await flush();
    expect(await readLookSettings(db)).toEqual(DEFAULT_LOOK_SETTINGS);
    store.setLook('neon', canUse);
    expect(store.getSnapshot().tryOn).toBeNull();
  });

  it('keeps settings for a look that is only being tried', async () => {
    const { db } = openDb();
    const store = createLookSettingsStore(db, DEFAULT_LOOK_SETTINGS);
    store.setConfig('expo', { v: 1 });
    store.setConfig('expo', { k: 40 });
    expect(store.getSnapshot().config.expo).toEqual({ v: 1, k: 40 });
    await flush();
    expect((await readLookSettings(db)).config.expo).toEqual({ v: 1, k: 40 });
  });

  it('saves a slider drag once, when it lets go', async () => {
    const { db, sqlite } = openDb();
    const store = createLookSettingsStore(db, DEFAULT_LOOK_SETTINGS);
    store.setConfig('golden', { k: 20 }, { persist: false });
    store.setConfig('golden', { k: 55 }, { persist: false });
    await flush();
    expect(sqlite.prepare('SELECT value FROM settings WHERE key = ?').all(LOOK_KEY)).toEqual([]);
    store.setConfig('golden', { k: 55 });
    await flush();
    expect((await readLookSettings(db)).config.golden).toEqual({ k: 55 });
  });

  it('tells readers about every change', () => {
    const { db } = openDb();
    const store = createLookSettingsStore(db, DEFAULT_LOOK_SETTINGS);
    const heard = jest.fn();
    const stop = store.subscribe(heard);
    store.setTryOn('paper');
    store.setTryOn('paper');
    store.setConfig('paper', { v: 2 });
    expect(heard).toHaveBeenCalledTimes(2);
    stop();
    store.setTryOn(null);
    expect(heard).toHaveBeenCalledTimes(2);
  });

  it('reports a failed save and keeps the look on screen', async () => {
    const { db } = openDb();
    const failing: SqlDatabase = {
      ...db,
      runAsync: () => Promise.reject(new Error('disk full')),
    };
    const onError = jest.fn();
    const store = createLookSettingsStore(failing, DEFAULT_LOOK_SETTINGS, onError);
    store.setLook('basic', canUse);
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().look).toBe('basic');
  });

  it('reads the database again after a wipe', async () => {
    const { db, sqlite } = openDb();
    const store = createLookSettingsStore(db, DEFAULT_LOOK_SETTINGS);
    store.setLook('neon', canUse);
    store.setTryOn('expo');
    await flush();
    sqlite.exec('DELETE FROM settings');
    await store.reload();
    expect(store.getSnapshot()).toEqual({ ...DEFAULT_LOOK_SETTINGS, tryOn: null });
  });
});
