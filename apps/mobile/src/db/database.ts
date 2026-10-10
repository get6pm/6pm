import type { SQLiteDatabase } from 'expo-sqlite';

import { databaseKey } from './database-key';
import { type Migration, runMigrations } from './migrate';

export const DATABASE_NAME = 'sixpm.db';

// Every file in ./migrations is one migration, named by its file. Adding a schema change is adding
// a file; nothing else lists them.
const files = require.context('./migrations', false, /\.ts$/);

const migrations: Migration[] = files.keys().map((key) => ({
  name: key.replace(/^\.\//, '').replace(/\.ts$/, ''),
  sql: files<{ sql: string }>(key).sql,
}));

/**
 * Unlocks the encrypted database and brings it to the current schema. Runs once, before the first
 * screen. The key must be the first statement on the connection.
 */
export async function prepareDatabase(db: SQLiteDatabase): Promise<void> {
  const key = await databaseKey();
  await db.execAsync(`PRAGMA key = "x'${key}'"`);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db, migrations);
}
