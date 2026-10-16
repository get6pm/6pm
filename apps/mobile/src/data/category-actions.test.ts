import { describe, expect, it, jest } from '@jest/globals';

import { sql as createSettings } from '../db/migrations/0001-create-settings';
import { sql as createMoneyTables } from '../db/migrations/0002-create-money-tables';
import { sql as createTogetherMoves } from '../db/migrations/0003-create-together-moves';
import { sql as addCurrencyGuessed } from '../db/migrations/0004-spend-currency-guessed';
import { sql as addBillPayments } from '../db/migrations/0008-bill-kind-and-payments';
import { categoryActions, tallyByCategory } from './category-actions';
import { moneyActions } from './money-actions';
import { createMoneyStore } from './money-store';
import type { SqlDatabase, SqlValue } from './table';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

// A real SQLite database in memory, from Node's own module (see migrate.test.ts).
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

async function openStore() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(createSettings);
  sqlite.exec(createMoneyTables);
  sqlite.exec(createTogetherMoves);
  sqlite.exec(addCurrencyGuessed);
  sqlite.exec(addBillPayments);
  const db: SqlDatabase = {
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
  const store = createMoneyStore(db, '2026-10-10');
  for (const [sort, [id, name]] of [
    ['food', 'Food'],
    ['drinks', 'Drinks'],
  ].entries()) {
    await store.tables.categories.put({
      id: id ?? '',
      name: name ?? '',
      icon: 'restaurant',
      hue: 45,
      countsDaily: true,
      sort,
      archivedAt: null,
    });
  }
  await store.load('2026-10-10');
  return store;
}

const at = new Date('2026-10-10T05:00:00Z');

describe('category actions', () => {
  it('adds a category at the end and edits it in place', async () => {
    const store = await openStore();
    const actions = categoryActions(store);
    const made = await actions.saveCategory({
      name: '  Pets ',
      icon: 'pets',
      hue: 200,
      countsDaily: true,
    });
    expect(made).toMatchObject({ name: 'Pets', sort: 2 });
    expect(
      await actions.saveCategory({ name: '  ', icon: 'pets', hue: 1, countsDaily: true }),
    ).toBeNull();

    await actions.saveCategory({ name: 'Work', icon: 'work', hue: 85, countsDaily: false }, 'food');
    const snap = store.getSnapshot();
    expect(snap.categories.map((c) => [c.id, c.name, c.countsDaily, c.sort])).toEqual([
      ['food', 'Work', false, 0],
      ['drinks', 'Drinks', true, 1],
      [made?.id, 'Pets', true, 2],
    ]);
    expect((await store.tables.categories.get('food'))?.name).toBe('Work');
  });

  it('keeps rules and spends on a renamed category', async () => {
    const store = await openStore();
    const money = moneyActions(store);
    await money.addSpend({
      amount: 45_000,
      categoryId: 'drinks',
      merchant: 'Highlands',
      source: 'manual',
      status: 'kept',
      at,
    });
    await money.rememberMerchant('Highlands', 'drinks');
    const actions = categoryActions(store);
    await actions.saveCategory(
      { name: 'Coffee', icon: 'local_cafe', hue: 25, countsDaily: true },
      'drinks',
    );
    expect(await actions.readRules()).toMatchObject([
      { merchant: 'Highlands', categoryId: 'drinks' },
    ]);
    expect(store.getSnapshot().cycleSpends[0]?.categoryId).toBe('drinks');
  });

  it('moves spends to the fallback, drops the rules and refuses the last one', async () => {
    const store = await openStore();
    const money = moneyActions(store);
    const spend = await money.addSpend({
      amount: 45_000,
      categoryId: 'food',
      merchant: 'Phở Thìn',
      source: 'manual',
      status: 'kept',
      at,
    });
    await money.rememberMerchant('Phở Thìn', 'food');
    await money.rememberMerchant('Highlands', 'drinks');
    const actions = categoryActions(store);

    expect((await actions.deleteCategory('food'))?.id).toBe('drinks');
    const snap = store.getSnapshot();
    expect(snap.categories.map((c) => c.id)).toEqual(['drinks']);
    expect(snap.cycleSpends.find((s) => s.id === spend.id)?.categoryId).toBe('drinks');
    expect((await actions.readRules()).map((r) => r.merchant)).toEqual(['Highlands']);
    expect((await store.tables.categories.get('food'))?.archivedAt).not.toBeNull();

    expect(await actions.deleteCategory('drinks')).toBeNull();
    expect(store.getSnapshot().categories.map((c) => c.id)).toEqual(['drinks']);

    await actions.removeRule('highlands');
    expect(await actions.readRules()).toEqual([]);
  });
});

describe('tallyByCategory', () => {
  it('counts what still stands this cycle', () => {
    const tallies = tallyByCategory([
      { categoryId: 'food', amount: 45_000, status: 'kept' },
      { categoryId: 'food', amount: 30_000, status: 'caught' },
      { categoryId: 'food', amount: 99_000, status: 'skipped' },
      { categoryId: 'drinks', amount: 25_000, status: 'pending' },
    ]);
    expect(tallies.get('food')).toEqual({ count: 2, total: 75_000 });
    expect(tallies.get('drinks')).toEqual({ count: 1, total: 25_000 });
    expect(tallies.get('gifts')).toBeUndefined();
  });
});
