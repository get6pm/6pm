import {
  billRowSchema,
  categoryRowSchema,
  closedDayRowSchema,
  merchantRuleRowSchema,
  potRowSchema,
  spendRowSchema,
} from '@6pm/domain';

import { createTable, type SqlDatabase } from './table';

/** Typed access to every money table, each row checked against its contract both ways. */
export function openMoneyTables(db: SqlDatabase) {
  return {
    categories: createTable(db, {
      name: 'categories',
      schema: categoryRowSchema,
      key: 'id',
      booleans: ['countsDaily'],
    }),
    spends: createTable(db, {
      name: 'spends',
      schema: spendRowSchema,
      key: 'id',
      booleans: ['forWork'],
      json: ['foreignAmount'],
    }),
    rules: createTable(db, {
      name: 'merchant_rules',
      schema: merchantRuleRowSchema,
      key: 'merchantKey',
      booleans: ['setByUser'],
    }),
    bills: createTable(db, { name: 'bills', schema: billRowSchema, key: 'id' }),
    pots: createTable(db, { name: 'pots', schema: potRowSchema, key: 'id', booleans: ['paused'] }),
    closedDays: createTable(db, {
      name: 'closed_days',
      schema: closedDayRowSchema,
      key: 'day',
      booleans: ['late'],
    }),
  };
}

export type MoneyTables = ReturnType<typeof openMoneyTables>;
