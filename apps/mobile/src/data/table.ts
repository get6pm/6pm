export type SqlValue = string | number | null;

/** The part of an expo-sqlite database the repositories use. */
export interface SqlDatabase {
  getAllAsync<T>(source: string, params: SqlValue[]): Promise<T[]>;
  runAsync(source: string, params: SqlValue[]): Promise<unknown>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/** The part of a contract row schema a table needs: its field names and its validation. */
export interface RowSchema<Row> {
  readonly shape: Readonly<Record<string, unknown>>;
  parse(value: unknown): Row;
}

export interface TableSpec<Row> {
  readonly name: string;
  readonly schema: RowSchema<Row>;
  /** The primary key field. */
  readonly key: keyof Row & string;
  /** Fields stored as 0 or 1. */
  readonly booleans?: readonly (keyof Row & string)[];
  /** Fields stored as JSON text. */
  readonly json?: readonly (keyof Row & string)[];
}

/** Typed reads and writes for one table. Every row is checked against the contract both ways. */
export interface Table<Row> {
  get(key: string): Promise<Row | null>;
  all(): Promise<Row[]>;
  where(field: keyof Row & string, value: SqlValue): Promise<Row[]>;
  /** Rows matching a SQL clause (`WHERE …`, `ORDER BY …`) with bound parameters. */
  select(clause: string, params: SqlValue[]): Promise<Row[]>;
  /** Inserts the row, or updates the one with the same key in place. */
  put(row: Row): Promise<void>;
  remove(key: string): Promise<void>;
  removeWhere(field: keyof Row & string, value: SqlValue): Promise<void>;
}

export function columnOf(field: string): string {
  return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function createTable<Row extends object>(db: SqlDatabase, spec: TableSpec<Row>): Table<Row> {
  const fields = Object.keys(spec.schema.shape);
  const booleans = new Set<string>(spec.booleans);
  const json = new Set<string>(spec.json);
  const columns = fields.map(columnOf);
  const keyColumn = columnOf(spec.key);

  const encode = (field: string, value: unknown): SqlValue => {
    if (value === null || value === undefined) return null;
    if (booleans.has(field)) return value === true ? 1 : 0;
    if (json.has(field)) return JSON.stringify(value);
    return value as string | number;
  };

  const decode = (stored: Record<string, SqlValue>): Row => {
    const row: Record<string, unknown> = {};
    for (const field of fields) {
      const value = stored[columnOf(field)] ?? null;
      if (value === null) row[field] = null;
      else if (booleans.has(field)) row[field] = value === 1;
      else if (json.has(field)) row[field] = JSON.parse(String(value));
      else row[field] = value;
    }
    return spec.schema.parse(row);
  };

  const select = async (clause: string, params: SqlValue[]) => {
    const rows = await db.getAllAsync<Record<string, SqlValue>>(
      `SELECT ${columns.join(', ')} FROM ${spec.name} ${clause}`,
      params,
    );
    return rows.map(decode);
  };

  return {
    get: async (key) => (await select(`WHERE ${keyColumn} = ?`, [key]))[0] ?? null,
    all: () => select(`ORDER BY ${keyColumn}`, []),
    where: (field, value) => select(`WHERE ${columnOf(field)} = ? ORDER BY ${keyColumn}`, [value]),
    select,
    put: async (row) => {
      const checked = spec.schema.parse(row) as Record<string, unknown>;
      // An upsert updates the row where it is. "INSERT OR REPLACE" would delete it and insert a
      // new one, and with foreign keys on, that delete cascades to the rows that belong to it (a
      // spend's sightings, a pot's moves).
      const assignments = columns
        .filter((column) => column !== keyColumn)
        .map((column) => `${column} = excluded.${column}`);
      await db.runAsync(
        `INSERT INTO ${spec.name} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) ` +
          (assignments.length > 0
            ? `ON CONFLICT (${keyColumn}) DO UPDATE SET ${assignments.join(', ')}`
            : `ON CONFLICT (${keyColumn}) DO NOTHING`),
        fields.map((field) => encode(field, checked[field])),
      );
    },
    remove: async (key) => {
      await db.runAsync(`DELETE FROM ${spec.name} WHERE ${keyColumn} = ?`, [key]);
    },
    removeWhere: async (field, value) => {
      await db.runAsync(`DELETE FROM ${spec.name} WHERE ${columnOf(field)} = ?`, [value]);
    },
  };
}
