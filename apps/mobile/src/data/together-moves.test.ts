import { describe, expect, it } from '@jest/globals';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { createMoneyStore, dayOf } from './money-store';
import { DEFAULT_PLAN, writePlan } from './plan-settings';
import { forgetTogetherMove, keepTogetherMoves, keptTogetherMoves } from './together-moves';

const TODAY = '2026-10-13';
const payday = { kind: 'lastDay' } as const;
const move = (id: string, amount: number, at = '2026-10-13T05:00:00.000Z') => ({
  id,
  potId: 'pot',
  potName: 'Đà Lạt',
  amount,
  at,
});

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
    expect(await keepTogetherMoves(s.db, [move('c1', 500_000)], payday)).toBe(1);
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(500_000);
    expect(dayOf(s.getSnapshot())?.free).toBe((before?.free ?? 0) - 500_000);
  });

  it('keeps each contribution once however often the shared copy is read', async () => {
    const s = await store();
    await keepTogetherMoves(s.db, [move('c1', 500_000)], payday);
    expect(await keepTogetherMoves(s.db, [move('c1', 500_000), move('c2', 100_000)], payday)).toBe(
      1,
    );
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(600_000);
  });

  it('leaves an earlier cycle alone', async () => {
    const s = await store();
    // Payday on the last day: the cycle 13 Oct sits in began on 30 Sep, so money added on 29 Sep
    // belongs to the one before and never touches this cycle's number.
    await keepTogetherMoves(s.db, [move('old', 900_000, '2026-09-29T05:00:00.000Z')], payday);
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(0);
  });

  it('stops counting a contribution taken back, and keeps the rest as history', async () => {
    const s = await store();
    await keepTogetherMoves(s.db, [move('c1', 500_000), move('c2', 200_000)], payday);
    await forgetTogetherMove(s.db, 'c1');
    await s.load(TODAY);
    expect(s.getSnapshot().topUpsThisCycle).toBe(200_000);
    expect(await keptTogetherMoves(s.db)).toEqual([{ potName: 'Đà Lạt', amount: 200_000 }]);
  });
});
