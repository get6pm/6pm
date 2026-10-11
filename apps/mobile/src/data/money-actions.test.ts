import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { DEFAULT_PLAN, writePlan } from './plan-settings';
import { openMemoryDb } from '../features/backup/test/memory-db';
import { moneyActions } from './money-actions';
import { createMoneyStore, type MoneyStore } from './money-store';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

const TODAY = '2026-10-11';

async function open(): Promise<{ store: MoneyStore; actions: ReturnType<typeof moneyActions> }> {
  const db = openMemoryDb();
  const store = createMoneyStore(db, TODAY);
  await writePlan(db, { ...DEFAULT_PLAN, income: 20_000_000, startedOn: '2026-10-01' });
  for (const [i, id] of ['food', 'shopping'].entries()) {
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

describe('moneyActions', () => {
  let ctx: Awaited<ReturnType<typeof open>>;
  beforeEach(async () => {
    ctx = await open();
  });

  it('files a capture under the day the screens show, and a recorded time under its money day', async () => {
    const now = await ctx.actions.addSpend(spend());
    expect(now.day).toBe(TODAY);
    // 01:00 on the 12th is still the 11th on the money clock.
    const small = await ctx.actions.addSpend(
      spend({ amount: 10_000, at: new Date(2026, 9, 12, 1, 0) }),
    );
    expect(small.day).toBe('2026-10-11');
    const morning = await ctx.actions.addSpend(
      spend({ amount: 12_000, at: new Date(2026, 9, 12, 8, 0) }),
    );
    expect(morning.day).toBe('2026-10-12');
  });

  it('merges the same payment seen two ways into one spend with both sightings', async () => {
    const at = new Date(2026, 9, 11, 12, 10);
    const qr = await ctx.actions.addSpend(
      spend({ source: 'qr', status: 'pending', at, detail: 'MB · ••4821' }),
    );
    const typed = await ctx.actions.addSpend(
      spend({ source: 'email', status: 'kept', at: new Date(at.getTime() + 90_000) }),
    );
    expect(typed.id).toBe(qr.id);
    expect(typed.status).toBe('kept');
    expect(ctx.store.getSnapshot().cycleSpends).toHaveLength(1);
    const sightings = await ctx.actions.sightings(qr.id);
    expect(sightings.map((s) => s.source).sort()).toEqual(['email', 'qr']);
    // Editing the spend afterwards must not cost it its trail.
    await ctx.actions.update(qr.id, { note: 'with Lan' });
    expect(await ctx.actions.sightings(qr.id)).toHaveLength(2);
  });

  it('keeps two payments apart when the amount differs, the gap is long, or the user typed it', async () => {
    const at = new Date(2026, 9, 11, 12, 10);
    await ctx.actions.addSpend(spend({ source: 'qr', status: 'pending', at }));
    await ctx.actions.addSpend(spend({ amount: 50_000, at }));
    await ctx.actions.addSpend(spend({ at: new Date(at.getTime() + 4 * 60_000) }));
    await ctx.actions.addSpend(spend({ source: 'cash', at }));
    expect(ctx.store.getSnapshot().cycleSpends).toHaveLength(4);
    // Something the user typed is never the same payment as a capture, cash or not.
    await ctx.actions.addSpend(spend({ source: 'manual', wallet: 'Cash', at }));
    expect(ctx.store.getSnapshot().cycleSpends).toHaveLength(5);
  });

  it('puts an edited card back as it arrived when undone', async () => {
    const caught = await ctx.actions.addSpend(spend({ source: 'qr', status: 'caught' }));
    await ctx.actions.setStatus(caught.id, 'kept', { amount: 55_000, categoryId: 'shopping' });
    expect(ctx.store.getSnapshot().cycleSpends[0]).toMatchObject({
      status: 'kept',
      amount: 55_000,
      categoryId: 'shopping',
    });
    await ctx.actions.undo(caught.id, { amount: caught.amount, categoryId: caught.categoryId });
    expect(ctx.store.getSnapshot().cycleSpends[0]).toMatchObject({
      status: 'caught',
      amount: 45_000,
      categoryId: 'food',
    });
  });

  it('keeps undo working after a double tap on delete', async () => {
    const kept = await ctx.actions.addSpend(spend());
    await ctx.actions.setStatus(kept.id, 'deleted');
    await ctx.actions.setStatus(kept.id, 'deleted');
    await ctx.actions.undo(kept.id);
    expect(ctx.store.getSnapshot().cycleSpends[0]?.status).toBe('kept');
  });

  it('applies writes to the same spend in order, so none overwrites another', async () => {
    const row = await ctx.actions.addSpend(spend({ source: 'qr', status: 'caught' }));
    await Promise.all([
      ctx.actions.update(row.id, { note: 'with Lan' }),
      ctx.actions.setStatus(row.id, 'kept'),
      ctx.actions.update(row.id, { wallet: 'MB Bank' }),
    ]);
    expect(ctx.store.getSnapshot().cycleSpends[0]).toMatchObject({
      note: 'with Lan',
      status: 'kept',
      wallet: 'MB Bank',
    });
  });

  it('learns a merchant once more each time it is confirmed, and finds its category', async () => {
    await ctx.actions.rememberMerchant('  Circle K ', 'shopping');
    await ctx.actions.rememberMerchant('circle k', 'shopping');
    expect((await ctx.store.tables.rules.get('circle k'))?.learnedTimes).toBe(2);
    expect(await ctx.actions.ruleCategory('CIRCLE K')).toBe('shopping');
    expect(await ctx.actions.ruleCategory('Highlands')).toBeNull();
    expect(await ctx.actions.ruleCategory('   ')).toBeNull();
  });

  it('numbers receipts by every day closed before, not only this pay cycle', async () => {
    for (const day of ['2026-08-30', '2026-09-30', '2026-10-09']) {
      await ctx.actions.closeDay({
        day,
        closedAt: `${day}T11:00:00.000Z`,
        late: false,
        spent: 0,
        line: 0,
        tomorrow: 0,
        note: null,
      });
    }
    expect(await ctx.actions.closedBefore('2026-10-11')).toBe(3);
    expect(await ctx.actions.closedBefore('2026-10-09')).toBe(2);
  });

  it('loads the closed days of the week and month even when payday splits them', async () => {
    const db = openMemoryDb();
    const store = createMoneyStore(db, TODAY);
    await writePlan(db, {
      ...DEFAULT_PLAN,
      income: 20_000_000,
      payday: { kind: 'sameDay', day: 10 },
    });
    for (const day of ['2026-10-01', '2026-10-05', '2026-10-09']) {
      await store.tables.closedDays.put({
        day,
        closedAt: `${day}T11:00:00.000Z`,
        late: false,
        spent: 0,
        line: 0,
        tomorrow: 0,
        note: null,
      });
    }
    await store.load(TODAY);
    // The pay cycle started on the 10th, yet the 1st and 5th belong to this month and week.
    expect(store.getSnapshot().closedDays.map((d) => d.day)).toEqual([
      '2026-10-01',
      '2026-10-05',
      '2026-10-09',
    ]);
  });
});
