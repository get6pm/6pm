import { describe, expect, it, jest } from '@jest/globals';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { moneyActions } from './money-actions';
import { createMoneyStore } from './money-store';
import { planActions } from './plan-actions';
import { DEFAULT_PLAN, writePlan } from './plan-settings';
import { createQueue } from './store-queue';
import type { SqlDatabase } from './table';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));
jest.mock('./money-provider', () => ({ useMoneyStore: () => null }));

const TODAY = '2026-10-11';

describe('createQueue', () => {
  it('runs tasks one after another in the order asked, and survives a failure', async () => {
    const exclusive = createQueue();
    const log: string[] = [];
    const slow = exclusive(async () => {
      log.push('slow start');
      await new Promise((resolve) => setTimeout(resolve, 20));
      log.push('slow end');
    });
    const failing = exclusive(() => {
      log.push('failing');
      return Promise.reject(new Error('boom'));
    });
    const last = exclusive(() => {
      log.push('last');
      return Promise.resolve(7);
    });
    await expect(failing).rejects.toThrow('boom');
    await slow;
    expect(await last).toBe(7);
    expect(log).toEqual(['slow start', 'slow end', 'failing', 'last']);
  });
});

/** A database that holds the first read of spends until released, and refuses nested transactions. */
function gatedDb() {
  const inner = openMemoryDb();
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let gated = false;
  let inTransaction = false;
  const db: SqlDatabase = {
    getAllAsync: async <T>(source: string, params: Parameters<SqlDatabase['getAllAsync']>[1]) => {
      const rows = await inner.getAllAsync<T>(source, params);
      // The first spends read (the load's) returns what it read, then waits: a write can slip in.
      if (!gated && source.includes('FROM spends') && source.includes('ORDER BY at DESC')) {
        gated = true;
        await gate;
      }
      return rows;
    },
    runAsync: (source, params) => inner.runAsync(source, params),
    withTransactionAsync: async (task) => {
      if (inTransaction) throw new Error('cannot start a transaction within a transaction');
      inTransaction = true;
      try {
        await inner.withTransactionAsync(task);
      } finally {
        inTransaction = false;
      }
    },
  };
  return { db, release };
}

async function open() {
  const { db, release } = gatedDb();
  const store = createMoneyStore(db, TODAY);
  await writePlan(db, {
    ...DEFAULT_PLAN,
    income: 20_000_000,
    payday: { kind: 'lastDay' },
    futureYou: 2_000_000,
    startedOn: '2026-09-01',
  });
  await store.tables.categories.put({
    id: 'food',
    name: 'Food',
    icon: 'restaurant',
    hue: 40,
    countsDaily: true,
    sort: 0,
    archivedAt: null,
  });
  return { store, release, money: moneyActions(store), plan: planActions(store) };
}

describe('the money store', () => {
  it('never publishes a load that read before a write finished', async () => {
    const { store, release, money } = await open();
    const loading = store.load(TODAY);
    // The load has read the spends and waits at the gate; now a write is asked for.
    await new Promise((resolve) => setTimeout(resolve, 20));
    const writing = money.addSpend({
      amount: 45_000,
      categoryId: 'food',
      merchant: 'Phở',
      source: 'manual',
      status: 'kept',
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    release();
    await Promise.all([loading, writing]);
    expect(store.getSnapshot().cycleSpends.map((s) => s.merchant)).toEqual(['Phở']);
    // A load queued after the write sees it too.
    await store.load(TODAY);
    expect(store.getSnapshot().cycleSpends).toHaveLength(1);
  });

  it('never nests transactions when plan writes and loads overlap', async () => {
    const { store, release, plan } = await open();
    release();
    await store.load(TODAY);
    const pot = {
      name: 'Japan',
      icon: 'flight',
      hue: 200,
      goal: 3_000_000,
      neededBy: '2026-12',
    };
    const made = await plan.createPot(pot);
    await Promise.all([
      store.load(TODAY),
      plan.updatePot(made.id, { goal: 2_000_000 }),
      plan.createPot({ ...pot, name: 'Cushion', kind: 'goal', neededBy: null }),
      store.load(TODAY),
      plan.updateMonth({ payday: { kind: 'sameDay', day: 25 } }),
      plan.topUp(made.id, 100_000),
    ]);
    const snap = store.getSnapshot();
    expect(snap.pots).toHaveLength(2);
    expect(snap.topUpsThisCycle).toBe(100_000);
    expect(snap.setAsideThisCycle[made.id]).toBe(1_000_000);
  });
});
