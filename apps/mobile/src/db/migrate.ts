/** One schema change. Its name is its file name, which is also the order it runs in. */
export interface Migration {
  readonly name: string;
  readonly sql: string;
}

/** The part of an expo-sqlite database the runner uses. */
export interface MigrationDatabase {
  execAsync(source: string): Promise<void>;
  getAllAsync<T>(source: string): Promise<T[]>;
  runAsync(source: string, params: string[]): Promise<unknown>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/**
 * Applies every migration the database has not seen, in name order, and returns the names it
 * applied. Each one commits together with its own record, so a failure leaves earlier migrations
 * in place and the failed one unrecorded.
 */
export async function runMigrations(
  db: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<string[]> {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)',
  );
  const rows = await db.getAllAsync<{ name: string }>('SELECT name FROM _migrations');
  const applied = new Set(rows.map((row) => row.name));
  const pending = migrations
    .filter((migration) => !applied.has(migration.name))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.runAsync('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)', [
        migration.name,
        new Date().toISOString(),
      ]);
    });
  }
  return pending.map((migration) => migration.name);
}
