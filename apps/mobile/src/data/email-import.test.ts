import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { EmailCapture } from '@6pm/domain';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { importEmailCaptures, type EmailCaptureSource } from './email-import';
import { moneyActions } from './money-actions';
import { createMoneyStore, type MoneyStore } from './money-store';
import { DEFAULT_PLAN, writePlan } from './plan-settings';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

const TODAY = '2026-10-11';

/** The server's waiting receipts, held in memory. */
function server(captures: EmailCapture[]) {
  const waiting = new Map(captures.map((c) => [c.id, c]));
  const acked: string[][] = [];
  const source: EmailCaptureSource & { failAck?: boolean } = {
    fetch: () => Promise.resolve([...waiting.values()]),
    ack: (ids) => {
      if (source.failAck) return Promise.reject(new Error('offline'));
      acked.push([...ids]);
      for (const id of ids) waiting.delete(id);
      return Promise.resolve();
    },
  };
  return { source, waiting, acked };
}

const receipt = (over: Partial<EmailCapture> = {}): EmailCapture => ({
  id: 'Zm9vYmFyYmF6cXV4MDEyMzQ1Njc4OWFi',
  amount: 38_000,
  merchant: 'Grab',
  at: new Date(2026, 9, 11, 13, 30).toISOString(),
  from: 'no-reply@grab.com',
  bank: null,
  code: null,
  ...over,
});

describe('importEmailCaptures', () => {
  let store: MoneyStore;
  let actions: ReturnType<typeof moneyActions>;

  beforeEach(async () => {
    const db = openMemoryDb();
    store = createMoneyStore(db, TODAY);
    await writePlan(db, { ...DEFAULT_PLAN, income: 20_000_000, startedOn: '2026-10-01' });
    for (const [i, id] of ['food', 'transport', 'shopping'].entries()) {
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
  });

  const run = (source: EmailCaptureSource) => importEmailCaptures({ store, actions, source });

  it('saves a receipt as an emailed spend waiting for the close, then acknowledges it', async () => {
    const { source, waiting, acked } = server([receipt()]);
    expect(await run(source)).toEqual({ saved: 1, acknowledged: 1 });
    expect(acked).toEqual([[receipt().id]]);
    expect(waiting.size).toBe(0);
    expect(await store.tables.spends.get(receipt().id)).toMatchObject({
      amount: 38_000,
      merchant: 'Grab',
      source: 'email',
      status: 'caught',
      detail: 'no-reply@grab.com',
      day: TODAY,
      categoryId: 'transport',
    });
  });

  it('files a receipt paid before 04:00 under the day before', async () => {
    const late = receipt({ at: new Date(2026, 9, 11, 2, 15).toISOString() });
    await run(server([late]).source);
    expect((await store.tables.spends.get(late.id))?.day).toBe('2026-10-10');
  });

  it('files under the merchant’s rule when there is one', async () => {
    await actions.rememberMerchant('Grab', 'shopping');
    await run(server([receipt()]).source);
    expect((await store.tables.spends.get(receipt().id))?.categoryId).toBe('shopping');
  });

  it('saves a receipt once when the acknowledgement was lost and it comes again', async () => {
    const remote = server([receipt()]);
    remote.source.failAck = true;
    await expect(run(remote.source)).rejects.toThrow('offline');
    expect(await store.tables.spends.get(receipt().id)).not.toBeNull();
    remote.source.failAck = false;
    expect(await run(remote.source)).toEqual({ saved: 0, acknowledged: 1 });
    expect(store.getSnapshot().cycleSpends).toHaveLength(1);
  });

  it('merges with the same payment scanned a minute earlier', async () => {
    const scanned = await actions.captureSpend({
      amount: 45_000,
      categoryId: 'food',
      merchant: 'Phở Hòa',
      source: 'qr',
      status: 'pending',
      at: new Date(2026, 9, 11, 12, 29),
    });
    const emailed = receipt({
      amount: 45_000,
      merchant: 'PHO HOA',
      at: new Date(2026, 9, 11, 12, 30).toISOString(),
      from: 'thongbao@mbbank.com.vn',
    });
    const remote = server([emailed]);
    await run(remote.source);
    const spends = store.getSnapshot().cycleSpends;
    expect(spends).toHaveLength(1);
    expect(spends[0]?.id).toBe(scanned.row.id);
    expect(await actions.sightings(scanned.row.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'email', detail: 'thongbao@mbbank.com.vn' }),
      ]),
    );
    // Fetched again (its acknowledgement lost), the sighting is found and nothing is added.
    expect(await run(server([emailed]).source)).toEqual({ saved: 0, acknowledged: 1 });
    expect(store.getSnapshot().cycleSpends).toHaveLength(1);
  });

  it('changes nothing when the server cannot be reached', async () => {
    const ack = jest.fn<EmailCaptureSource['ack']>();
    const source: EmailCaptureSource = { fetch: () => Promise.reject(new Error('network')), ack };
    await expect(run(source)).rejects.toThrow('network');
    expect(ack).not.toHaveBeenCalled();
    expect(store.getSnapshot().cycleSpends).toHaveLength(0);
  });

  it('asks the server to delete nothing when nothing is waiting', async () => {
    const remote = server([]);
    expect(await run(remote.source)).toEqual({ saved: 0, acknowledged: 0 });
    expect(remote.acked).toEqual([]);
  });
});
