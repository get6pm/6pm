import { describe, expect, it } from '@jest/globals';

import { sql as createSettings } from '../db/migrations/0001-create-settings';
import {
  COMPANION_KEY,
  DEFAULT_COMPANION_SETTINGS,
  chooseCompanion,
  createCompanionSettingsStore,
  parseCompanionSettings,
  readCompanionSettings,
  writeCompanionSettings,
} from './companion-settings';
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

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('parseCompanionSettings', () => {
  it('starts with no pick, the sun to fall back to and the app’s own icon', () => {
    expect(parseCompanionSettings(null)).toEqual(DEFAULT_COMPANION_SETTINGS);
    expect(DEFAULT_COMPANION_SETTINGS).toEqual({ chosen: null, lastFree: 'sun', icon: false });
  });

  it('reads a stored pick', () => {
    expect(parseCompanionSettings('{"chosen":"hac","lastFree":"giot","icon":true}')).toEqual({
      chosen: 'hac',
      lastFree: 'giot',
      icon: true,
    });
  });

  it('falls back field by field on forms it does not know', () => {
    expect(parseCompanionSettings('{"chosen":"dragon","lastFree":"giot","icon":true}')).toEqual({
      chosen: null,
      lastFree: 'giot',
      icon: true,
    });
    expect(parseCompanionSettings('{"chosen":"nhang","lastFree":"phoenix"}')).toEqual({
      chosen: 'nhang',
      lastFree: 'sun',
      icon: false,
    });
  });

  it('never falls back to a Max-only form', () => {
    expect(parseCompanionSettings('{"chosen":"hac","lastFree":"max"}').lastFree).toBe('sun');
  });

  it('falls back to the default on text that is not the shape', () => {
    expect(parseCompanionSettings('not json')).toEqual(DEFAULT_COMPANION_SETTINGS);
    expect(parseCompanionSettings('"giot"')).toEqual(DEFAULT_COMPANION_SETTINGS);
    expect(parseCompanionSettings('null')).toEqual(DEFAULT_COMPANION_SETTINGS);
    expect(parseCompanionSettings('{"chosen":3,"icon":"yes"}')).toEqual(DEFAULT_COMPANION_SETTINGS);
  });
});

describe('chooseCompanion', () => {
  it('remembers a free pick as the one to fall back to, and a Max pick only as the pick', () => {
    const free = chooseCompanion(DEFAULT_COMPANION_SETTINGS, 'banhbao');
    expect(free).toEqual({ chosen: 'banhbao', lastFree: 'banhbao', icon: false });
    expect(chooseCompanion(free, 'hac')).toEqual({
      chosen: 'hac',
      lastFree: 'banhbao',
      icon: false,
    });
  });
});

describe('the companion store', () => {
  it('round-trips through the settings table', async () => {
    const { db } = openDb();
    expect(await readCompanionSettings(db)).toEqual(DEFAULT_COMPANION_SETTINGS);
    await writeCompanionSettings(db, { chosen: 'giot', lastFree: 'giot', icon: true });
    expect(await readCompanionSettings(db)).toEqual({
      chosen: 'giot',
      lastFree: 'giot',
      icon: true,
    });
  });

  it('picks only what the customer may wear, and saves the last pick', async () => {
    const { db, sqlite } = openDb();
    const store = createCompanionSettingsStore(db, DEFAULT_COMPANION_SETTINGS);
    const freeOnly = (form: string) => form !== 'hac' && form !== 'max';
    expect(store.choose('hac', freeOnly)).toBe(false);
    expect(store.getSnapshot().chosen).toBeNull();
    expect(store.choose('nhang', freeOnly)).toBe(true);
    expect(store.choose('giot', freeOnly)).toBe(true);
    store.setIcon(true);
    await flush();
    const row = sqlite.prepare('SELECT value FROM settings WHERE key = ?').get(COMPANION_KEY) as {
      value: string;
    };
    expect(parseCompanionSettings(row.value)).toEqual({
      chosen: 'giot',
      lastFree: 'giot',
      icon: true,
    });
  });

  it('reads the database again on reload', async () => {
    const { db } = openDb();
    const store = createCompanionSettingsStore(db, {
      chosen: 'giot',
      lastFree: 'giot',
      icon: true,
    });
    await db.runAsync('DELETE FROM settings', []);
    await store.reload();
    expect(store.getSnapshot()).toEqual(DEFAULT_COMPANION_SETTINGS);
  });
});
