import { sql as createSettings } from '../../../db/migrations/0001-create-settings';
import { sql as createMoneyTables } from '../../../db/migrations/0002-create-money-tables';
import { sql as createTogetherMoves } from '../../../db/migrations/0003-create-together-moves';
import { sql as addCurrencyGuessed } from '../../../db/migrations/0004-spend-currency-guessed';
import { sql as addSightingCapture } from '../../../db/migrations/0006-sighting-capture-id';
import { sql as addPotMoveOpening } from '../../../db/migrations/0007-pot-move-opening';
import { sql as addBillPayments } from '../../../db/migrations/0008-bill-kind-and-payments';
import { sql as addSpendMemo } from '../../../db/migrations/0009-spend-memo';
import { createMoneyStore, type MoneyStore } from '../../../data/money-store';
import type { SqlDatabase, SqlValue } from '../../../data/table';

// A real SQLite database in memory, from Node's own module, with the app's own schema.
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

export function openMemoryDb(): SqlDatabase {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(createSettings);
  sqlite.exec(createMoneyTables);
  sqlite.exec(createTogetherMoves);
  sqlite.exec(addCurrencyGuessed);
  sqlite.exec(addSightingCapture);
  sqlite.exec(addPotMoveOpening);
  sqlite.exec(addBillPayments);
  sqlite.exec(addSpendMemo);
  return {
    getAllAsync: <T>(source: string, params: SqlValue[]) =>
      Promise.resolve(sqlite.prepare(source).all(...params) as T[]),
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
}

export function openMemoryStore(today = '2026-10-11'): MoneyStore {
  return createMoneyStore(openMemoryDb(), today);
}
