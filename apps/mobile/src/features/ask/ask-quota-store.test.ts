import { describe, expect, it } from '@jest/globals';

import { freeAsksLeft } from '@6pm/domain';

import { sql as createSettings } from '../../db/migrations/0001-create-settings';
import type { SqlDatabase, SqlValue } from '../../data/table';
import { ASKED_ON_KEY, readAskedOn, recordAsk } from './ask-quota-store';

// A real SQLite database in memory, from Node's own module (see look-settings.test.ts).
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

describe('the free question count', () => {
  it('starts empty and counts each question against its day', async () => {
    const { db } = openDb();
    expect(await readAskedOn(db)).toEqual([]);
    await recordAsk(db, '2026-10-12');
    await recordAsk(db, '2026-10-13');
    const asked = await recordAsk(db, '2026-10-13');
    expect(asked).toEqual(['2026-10-12', '2026-10-13', '2026-10-13']);
    expect(await readAskedOn(db)).toEqual(asked);
    // Each day has its own ten: two used on the 13th, none counted the day after.
    expect(freeAsksLeft(asked, '2026-10-13')).toBe(8);
    expect(freeAsksLeft(asked, '2026-10-14')).toBe(10);
  });

  it('forgets questions older than a few weeks', async () => {
    const { db } = openDb();
    await recordAsk(db, '2026-08-03');
    await recordAsk(db, '2026-09-14');
    const asked = await recordAsk(db, '2026-10-12');
    expect(asked).toEqual(['2026-09-14', '2026-10-12']);
  });

  it('reads a damaged setting as no questions asked, and mends it on the next question', async () => {
    const { db, sqlite } = openDb();
    for (const damaged of ['not json', '{"a":1}', '["tomorrow"]', '[1,2]']) {
      sqlite
        .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
        .run(ASKED_ON_KEY, damaged);
      expect(await readAskedOn(db)).toEqual([]);
    }
    expect(await recordAsk(db, '2026-10-12')).toEqual(['2026-10-12']);
  });
});
