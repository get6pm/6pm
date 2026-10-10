import { describe, expect, it } from '@jest/globals';

import { type Migration, type MigrationDatabase, runMigrations } from './migrate';

// A real SQLite database in memory, from Node's own module. Jest's module loader does not know
// `node:sqlite`, so it is taken from the process instead of imported.
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

function openDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  const db: MigrationDatabase = {
    execAsync: (source) => Promise.resolve(sqlite.exec(source)),
    getAllAsync: <T>(source: string) => Promise.resolve(sqlite.prepare(source).all() as T[]),
    runAsync: (source, params) => Promise.resolve(sqlite.prepare(source).run(...params)),
    withTransactionAsync: async (task) => {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const column = (source: string) =>
    sqlite
      .prepare(source)
      .all()
      .map((row) => Object.values(row)[0]);
  return { db, column };
}

// Each migration logs its own run, so the log shows what ran, how often and in what order.
const createLog: Migration = {
  name: '0001-create-log',
  sql: "CREATE TABLE log (step TEXT NOT NULL); INSERT INTO log VALUES ('first');",
};
const second: Migration = { name: '0002-second', sql: "INSERT INTO log VALUES ('second');" };
const third: Migration = { name: '0003-third', sql: "INSERT INTO log VALUES ('third');" };

describe('runMigrations', () => {
  it('applies each migration once and in file-name order', async () => {
    const { db, column } = openDatabase();

    // Listed out of order: the second would fail if it ran before the table exists.
    expect(await runMigrations(db, [second, createLog])).toEqual([
      '0001-create-log',
      '0002-second',
    ]);

    // A later start with one new file runs only that file.
    expect(await runMigrations(db, [third, second, createLog])).toEqual(['0003-third']);
    expect(await runMigrations(db, [third, second, createLog])).toEqual([]);

    expect(column('SELECT step FROM log ORDER BY rowid')).toEqual(['first', 'second', 'third']);
    expect(column('SELECT name FROM _migrations ORDER BY name')).toEqual([
      '0001-create-log',
      '0002-second',
      '0003-third',
    ]);
  });
});
