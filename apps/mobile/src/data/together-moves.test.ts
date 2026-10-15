import { describe, expect, it } from '@jest/globals';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { createMoneyStore, dayOf } from './money-store';
import { DEFAULT_PLAN, writePlan } from './plan-settings';
import { keepTogetherMoves, keptTogetherMoves, reconcileTogetherMoves } from './together-moves';

const TODAY = '2026-10-13';
const payday = { kind: 'lastDay' } as const;
const move = (id: string, amount: number, at = '2026-10-13T05:00:00.000Z', currency = 'VND') => ({
  id,
  potId: 'pot',
  potName: 'Đà Lạt',
  amount,
  currency,
  at,
});
/** Đồng is home; a dollar is 26.000₫, and no other rate is known. */
const inHome = (amount: number, currency: string) =>
  currency === 'VND' ? amount : currency === 'USD' ? (amount * 26_000) / 100 : null;

async function store() {
  const db = openMemoryDb();
  await writePlan(db, { ...DEFAULT_PLAN, income: 20_000_000 });
  const s = createMoneyStore(db, TODAY);
  await s.load(TODAY);
  return s;
}

describe('money put into shared pots', () => {
  it('counts like a top-up in the cycle it was added, and lowers the daily number', async () => {
    const s = await store();
    const before = dayOf(s.getSnapshot());
    expect(await keepTogetherMoves(s.db, [move('c1', 500_000)], payday, inHome)).toBe(1);
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(500_000);
    expect(dayOf(s.getSnapshot())?.free).toBe((before?.free ?? 0) - 500_000);
  });

  it('keeps each contribution once however often the shared copy is read', async () => {
    const s = await store();
    await keepTogetherMoves(s.db, [move('c1', 500_000)], payday, inHome);
    expect(
      await keepTogetherMoves(s.db, [move('c1', 500_000), move('c2', 100_000)], payday, inHome),
    ).toBe(1);
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(600_000);
  });

  it('leaves an earlier cycle alone', async () => {
    const s = await store();
    // Payday on the last day: the cycle 13 Oct sits in began on 30 Sep, so money added on 29 Sep
    // belongs to the one before and never touches this cycle's number.
    await keepTogetherMoves(
      s.db,
      [move('old', 900_000, '2026-09-29T05:00:00.000Z')],
      payday,
      inHome,
    );
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(0);
  });

  it('drops a contribution the server no longer lists in a pot that is still shared', async () => {
    const s = await store();
    await keepTogetherMoves(s.db, [move('c1', 500_000), move('c2', 200_000)], payday, inHome);
    // c1 was taken back (the answer was lost, or it happened on another device).
    expect(await reconcileTogetherMoves(s.db, [move('c2', 200_000)], ['pot'], payday, inHome)).toBe(
      1,
    );
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(200_000);
    expect(await keptTogetherMoves(s.db)).toEqual([{ potName: 'Đà Lạt', amount: 200_000 }]);
  });

  it('counts a pot in another currency in the home one, once its rate is known', async () => {
    const s = await store();
    // $20 into a pot kept in dollars is 520.000₫ against this plan.
    expect(
      await keepTogetherMoves(s.db, [move('usd', 2_000, undefined, 'USD')], payday, inHome),
    ).toBe(1);
    // No rate for baht on this phone yet: it waits, and is kept on a later read.
    const baht = move('thb', 50_000, undefined, 'THB');
    expect(await keepTogetherMoves(s.db, [baht], payday, inHome)).toBe(0);
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(520_000);
    expect(await keepTogetherMoves(s.db, [baht], payday, () => 700_000)).toBe(1);
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(1_220_000);
  });

  it('keeps history for a pot that is gone, and after leaving', async () => {
    const s = await store();
    await keepTogetherMoves(s.db, [move('c1', 500_000)], payday, inHome);
    // The pot was deleted: other pots are live, this one is not.
    expect(await reconcileTogetherMoves(s.db, [], ['another-pot'], payday, inHome)).toBe(0);
    // Left Budget together: nothing is live.
    expect(await reconcileTogetherMoves(s.db, [], [], payday, inHome)).toBe(0);
    expect(await keptTogetherMoves(s.db)).toEqual([{ potName: 'Đà Lạt', amount: 500_000 }]);
  });
});
