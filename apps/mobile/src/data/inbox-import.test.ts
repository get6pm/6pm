import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { InboxItem, InboxSpend } from '@6pm/domain';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { importInbox, type InboxImportDeps } from './inbox-import';
import { moneyActions } from './money-actions';
import { createMoneyStore, type MoneyStore } from './money-store';
import { DEFAULT_PLAN, writePlan } from './plan-settings';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

const TODAY = '2026-10-11';

/** An inbox held in memory, as the App Group folder would hold it. */
function memoryInbox(items: readonly (InboxItem | string)[]) {
  const files = new Map(
    items.map((item, i) => [`f${i}`, typeof item === 'string' ? item : JSON.stringify(item)]),
  );
  return {
    files,
    readInbox: () => Promise.resolve([...files].map(([id, json]) => ({ id, json }))),
    removeInbox: (ids: readonly string[]) => {
      for (const id of ids) files.delete(id);
      return Promise.resolve();
    },
  };
}

const tap = (over: Partial<InboxSpend> = {}): InboxSpend => ({
  v: 1,
  id: crypto.randomUUID(),
  kind: 'spend',
  source: 'applePay',
  status: 'caught',
  at: new Date(2026, 9, 11, 12, 30).toISOString(),
  amount: 45_000,
  merchant: 'Phở Hòa',
  categoryId: null,
  ...over,
});

describe('importInbox', () => {
  let store: MoneyStore;
  let actions: ReturnType<typeof moneyActions>;
  let report: jest.Mock<(message: string) => void>;

  beforeEach(async () => {
    const db = openMemoryDb();
    store = createMoneyStore(db, TODAY);
    await writePlan(db, { ...DEFAULT_PLAN, income: 20_000_000, startedOn: '2026-10-01' });
    for (const [i, id] of ['food', 'drinks', 'shopping'].entries()) {
      await store.tables.categories.put({
        id,
        name: id,
        icon: 'restaurant',
        hue: 40,
        countsDaily: true,
        sort: i,
        archivedAt: null,
      });
    }
    await store.load(TODAY);
    actions = moneyActions(store);
    report = jest.fn<(message: string) => void>();
  });

  const run = (inbox: ReturnType<typeof memoryInbox>, enrich?: InboxImportDeps['enrich']) =>
    importInbox({
      store,
      actions,
      inbox,
      report,
      enrich: enrich ?? ((item) => Promise.resolve(item)),
    });

  it('saves a capture under its own id and removes the file', async () => {
    const item = tap();
    const inbox = memoryInbox([item]);
    expect(await run(inbox)).toEqual({ saved: 1, removed: 1 });
    expect(inbox.files.size).toBe(0);
    const row = await store.tables.spends.get(item.id);
    expect(row).toMatchObject({ amount: 45_000, source: 'applePay', status: 'caught', day: TODAY });
  });

  it('changes nothing when the same file is imported again', async () => {
    const item = tap();
    await run(memoryInbox([item]));
    expect(await run(memoryInbox([item]))).toEqual({ saved: 0, removed: 1 });
    expect(store.getSnapshot().cycleSpends).toHaveLength(1);
  });

  it('keeps one spend when Wallet reports the same tap twice', async () => {
    const first = tap();
    const again = tap({ at: new Date(Date.parse(first.at) + 30_000).toISOString() });
    await run(memoryInbox([first, again]));
    expect(store.getSnapshot().cycleSpends).toHaveLength(1);
  });

  it('keeps one spend when the same receipt is shared twice', async () => {
    const receipt = { bank: 'Vietcombank', code: 'FT26285ABC', namingLines: [] };
    const first = tap({ source: 'shared', receipt });
    const again = tap({ source: 'shared', receipt, at: new Date(2026, 9, 11, 14).toISOString() });
    await run(memoryInbox([first, again]));
    const rows = store.getSnapshot().cycleSpends;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.detail).toBe('Vietcombank · FT26285ABC');
  });

  it('merges a shared receipt into the QR payment it was, and a second import is a no-op', async () => {
    const qr = await actions.addSpend({
      amount: 45_000,
      categoryId: 'food',
      merchant: 'PHO HOA',
      source: 'qr',
      status: 'pending',
      at: new Date(2026, 9, 11, 12, 29),
    });
    const shared = tap({ source: 'shared' });
    await run(memoryInbox([shared]));
    await run(memoryInbox([shared]));
    expect(store.getSnapshot().cycleSpends.map((s) => s.id)).toEqual([qr.id]);
    expect(await actions.sightings(qr.id)).toHaveLength(2);
  });

  it('saves a shared foreign receipt in đồng with its own amount and rate', async () => {
    const item = tap({
      source: 'shared',
      amount: 1_341_634,
      foreign: { currency: 'SGD', amount: '68.80', rate: '19500.5' },
    });
    await run(memoryInbox([item]));
    expect(await store.tables.spends.get(item.id)).toMatchObject({
      amount: 1_341_634,
      foreignAmount: { currency: 'SGD', amount: 68.8, rate: 19_500.5 },
    });
  });

  it('keeps a guessed currency marked on the saved spend', async () => {
    const guessed = tap({ source: 'shared', amount: 368_160, currencyGuessed: true });
    const printed = tap({ source: 'shared', amount: 101_500, at: new Date().toISOString() });
    await run(memoryInbox([guessed, printed]));
    expect((await store.tables.spends.get(guessed.id))?.currencyGuessed).toBe(true);
    expect((await store.tables.spends.get(printed.id))?.currencyGuessed).toBe(false);
  });

  it('files under the rule for the merchant when the extension named no category', async () => {
    await actions.rememberMerchant('Phở Hòa', 'shopping');
    const item = tap();
    await run(memoryInbox([item]));
    expect((await store.tables.spends.get(item.id))?.categoryId).toBe('shopping');
  });

  it('files a capture made after midnight under the money day it happened on', async () => {
    const item = tap({ at: new Date(2026, 9, 12, 1, 15).toISOString() });
    await run(memoryInbox([item]));
    expect((await store.tables.spends.get(item.id))?.day).toBe(TODAY);
  });

  it('names a shared receipt through enrich, and only a shared one', async () => {
    const enrich = jest.fn((item: InboxSpend) => Promise.resolve({ ...item, merchant: 'Phở Hòa' }));
    const shared = tap({ source: 'shared', merchant: '' });
    await run(memoryInbox([shared, tap({ amount: 20_000 })]), enrich);
    expect(enrich).toHaveBeenCalledTimes(1);
    expect((await store.tables.spends.get(shared.id))?.merchant).toBe('Phở Hòa');
  });

  it('drops an unreadable file and an unknown version without saying what was in it', async () => {
    const inbox = memoryInbox(['{not json', JSON.stringify({ ...tap(), v: 2 })]);
    expect(await run(inbox)).toEqual({ saved: 0, removed: 2 });
    expect(report).toHaveBeenCalledTimes(2);
    expect(String(report.mock.calls[0]?.[0])).not.toContain('not json');
  });

  it('marks a waiting payment kept when Paid was tapped, and leaves an answered one', async () => {
    const waiting = await actions.addSpend({
      amount: 55_000,
      categoryId: 'food',
      merchant: 'Cơm tấm',
      source: 'qr',
      status: 'pending',
    });
    const paid = { v: 1 as const, id: crypto.randomUUID(), kind: 'paid' as const, at: tap().at };
    await run(memoryInbox([{ ...paid, spendId: waiting.id }]));
    expect((await store.tables.spends.get(waiting.id))?.status).toBe('kept');

    await actions.setStatus(waiting.id, 'skipped');
    await run(memoryInbox([{ ...paid, id: crypto.randomUUID(), spendId: waiting.id }]));
    expect((await store.tables.spends.get(waiting.id))?.status).toBe('skipped');
  });

  it('saves an amount the source could not read as 0, waiting for the close', async () => {
    const item = tap({ source: 'voice', status: 'kept', amount: null, merchant: '' });
    await run(memoryInbox([item]));
    expect(await store.tables.spends.get(item.id)).toMatchObject({ amount: 0, status: 'caught' });
  });
});
