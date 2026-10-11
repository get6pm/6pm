import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { moneyActions } from './money-actions';
import { createMoneyStore, dayOf, waitingOf, type MoneyStore } from './money-store';
import { DEFAULT_PLAN, writePlan } from './plan-settings';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

const TODAY = '2026-10-11';

async function open(payday: { kind: 'sameDay'; day: number } = { kind: 'sameDay', day: 25 }) {
  const db = openMemoryDb();
  const store: MoneyStore = createMoneyStore(db, TODAY);
  await writePlan(db, { ...DEFAULT_PLAN, income: 20_000_000, payday, startedOn: '2026-09-01' });
  await store.tables.categories.put({
    id: 'food',
    name: 'Food',
    icon: 'restaurant',
    hue: 40,
    countsDaily: true,
    sort: 0,
    archivedAt: null,
  });
  await store.load(TODAY);
  return { store, actions: moneyActions(store) };
}

const spend = (over: Partial<Parameters<ReturnType<typeof moneyActions>['addSpend']>[0]> = {}) => ({
  amount: 45_000,
  categoryId: 'food',
  merchant: 'Phở Hòa',
  source: 'manual' as const,
  status: 'kept' as const,
  ...over,
});

describe('a capture that is cancelled', () => {
  let ctx: Awaited<ReturnType<typeof open>>;
  beforeEach(async () => {
    ctx = await open();
  });

  it('deletes the row it made', async () => {
    const capture = await ctx.actions.captureSpend(spend({ source: 'qr', status: 'pending' }));
    expect(capture.merged).toBe(false);
    await ctx.actions.withdrawCapture(capture);
    expect(ctx.store.getSnapshot().cycleSpends).toHaveLength(0);
    expect((await ctx.store.tables.spends.get(capture.row.id))?.status).toBe('deleted');
  });

  it('leaves a typed cash spend alone: it never merges with a scan at all', async () => {
    const at = new Date(2026, 9, 11, 12, 0);
    const cash = await ctx.actions.addSpend(spend({ wallet: 'Cash', at }));
    const scan = await ctx.actions.captureSpend(
      spend({ source: 'qr', status: 'pending', at: new Date(at.getTime() + 120_000) }),
    );
    expect(scan.merged).toBe(false);
    expect(scan.row.id).not.toBe(cash.id);
    await ctx.actions.withdrawCapture(scan);
    expect(ctx.store.getSnapshot().cycleSpends.map((s) => s.id)).toEqual([cash.id]);
  });

  it('takes back only its own sighting from a payment it was merged into', async () => {
    const at = new Date(2026, 9, 11, 12, 0);
    const email = await ctx.actions.addSpend(
      spend({ source: 'email', status: 'caught', at, note: 'bank email' }),
    );
    const scan = await ctx.actions.captureSpend(
      spend({
        source: 'qr',
        status: 'kept',
        at: new Date(at.getTime() + 60_000),
        wallet: 'MB Bank',
      }),
    );
    expect(scan.merged).toBe(true);
    expect(scan.row.id).toBe(email.id);
    expect(scan.row.status).toBe('kept');
    expect(await ctx.actions.sightings(email.id)).toHaveLength(2);

    await ctx.actions.withdrawCapture(scan);
    const after = ctx.store.getSnapshot().cycleSpends;
    expect(after).toHaveLength(1);
    // Back as the email left it, without a trail of one.
    expect(after[0]).toMatchObject({ id: email.id, status: 'caught', wallet: null });
    expect(after[0]?.status).not.toBe('deleted');
    expect(await ctx.actions.sightings(email.id)).toHaveLength(0);
    expect(await ctx.store.tables.spends.get(email.id)).toMatchObject({ status: 'caught' });
  });

  it('keeps what the user did to a merged payment since, and still drops the sighting', async () => {
    const at = new Date(2026, 9, 11, 12, 0);
    const email = await ctx.actions.addSpend(spend({ source: 'email', status: 'caught', at }));
    const scan = await ctx.actions.captureSpend(
      spend({ source: 'qr', status: 'pending', at: new Date(at.getTime() + 60_000) }),
    );
    await ctx.actions.update(email.id, { note: 'with Lan', status: 'kept' });
    await ctx.actions.withdrawCapture(scan);
    expect(ctx.store.getSnapshot().cycleSpends[0]).toMatchObject({
      id: email.id,
      status: 'kept',
      note: 'with Lan',
    });
    expect(await ctx.actions.sightings(email.id)).toHaveLength(0);
  });

  it('leaves a trail of two or more when a third sighting was already there', async () => {
    const at = new Date(2026, 9, 11, 12, 0);
    await ctx.actions.addSpend(spend({ source: 'email', status: 'caught', at }));
    const shared = await ctx.actions.captureSpend(
      spend({ source: 'shared', status: 'caught', at: new Date(at.getTime() + 30_000) }),
    );
    const scan = await ctx.actions.captureSpend(
      spend({ source: 'qr', status: 'pending', at: new Date(at.getTime() + 60_000) }),
    );
    expect(await ctx.actions.sightings(shared.row.id)).toHaveLength(3);
    await ctx.actions.withdrawCapture(scan);
    expect((await ctx.actions.sightings(shared.row.id)).map((s) => s.source).sort()).toEqual([
      'email',
      'shared',
    ]);
  });
});

describe('cash added to a close that ran past 04:00', () => {
  it('is filed under the day being closed', async () => {
    const { store, actions } = await open();
    const cash = await actions.addSpend(
      spend({ source: 'cash', wallet: 'Cash', day: '2026-10-10' }),
    );
    expect(cash.day).toBe('2026-10-10');
    expect(store.getSnapshot().cycleSpends.map((s) => s.day)).toEqual(['2026-10-10']);
  });
});

describe('waiting items from before payday', () => {
  const caught = (day: string, over = {}) => ({
    ...spend({ source: 'email', status: 'caught' }),
    at: new Date(`${day}T05:00:00Z`),
    day,
    ...over,
  });

  it('are loaded outside the pay cycle, listed as waiting and kept out of this cycle’s number', async () => {
    const { store, actions } = await open({ kind: 'sameDay', day: 10 });
    // Payday was the 10th; the 9th belonged to the cycle before.
    const today = await actions.addSpend(caught(TODAY));
    const old = await actions.addSpend(caught(TODAY, { amount: 85_000 }));
    const answered = await actions.addSpend(caught(TODAY, { amount: 30_000, status: 'kept' }));
    for (const [row, at] of [
      [old, '05:00'],
      [answered, '06:00'],
    ] as const) {
      await store.tables.spends.put({ ...row, day: '2026-10-09', at: `2026-10-09T${at}:00.000Z` });
    }
    await store.load(TODAY);
    const snap = store.getSnapshot();
    expect(snap.cycle.start).toBe('2026-10-10');
    // Only the one still waiting is loaded, and it is not part of this cycle.
    expect(snap.waitingBefore.map((s) => s.id)).toEqual([old.id]);
    expect(snap.cycleSpends.map((s) => s.id)).toEqual([today.id]);
    expect(waitingOf(snap).map((s) => s.id)).toEqual([today.id, old.id]);
    // It counted in its own cycle; counting it here too would take the money out twice.
    expect(dayOf(snap)?.spent).toBe(45_000);
  });

  it('can be kept or deleted, and stay reachable while they are answered', async () => {
    const { store, actions } = await open({ kind: 'sameDay', day: 10 });
    const made = await actions.addSpend(caught(TODAY));
    await store.tables.spends.put({ ...made, day: '2026-10-09' });
    await store.load(TODAY);
    expect(waitingOf(store.getSnapshot()).map((s) => s.id)).toEqual([made.id]);

    await actions.setStatus(made.id, 'kept');
    expect(waitingOf(store.getSnapshot())).toHaveLength(0);
    expect(store.getSnapshot().waitingBefore[0]).toMatchObject({ id: made.id, status: 'kept' });
    await actions.undo(made.id);
    expect(waitingOf(store.getSnapshot()).map((s) => s.id)).toEqual([made.id]);

    await actions.setStatus(made.id, 'deleted');
    expect(store.getSnapshot().waitingBefore).toHaveLength(0);
    await store.load(TODAY);
    expect(store.getSnapshot().waitingBefore).toHaveLength(0);
  });
});
