import { describe, expect, it, jest } from '@jest/globals';

import { sql as createSettings } from '../db/migrations/0001-create-settings';
import { sql as createMoneyTables } from '../db/migrations/0002-create-money-tables';
import { sql as createTogetherMoves } from '../db/migrations/0003-create-together-moves';
import { createMoneyStore, dayOf } from './money-store';
import { planActions } from './plan-actions';
import { DEFAULT_PLAN, writePlan } from './plan-settings';
import type { SqlDatabase, SqlValue } from './table';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));
jest.mock('./money-provider', () => ({ useMoneyStore: () => null }));

// A real SQLite database in memory, from Node's own module (see migrate.test.ts).
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

async function open(today: string, startedOn = '2026-09-01') {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(createSettings);
  sqlite.exec(createMoneyTables);
  sqlite.exec(createTogetherMoves);
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
  const store = createMoneyStore(db, today);
  await writePlan(db, {
    ...DEFAULT_PLAN,
    income: 20_000_000,
    payday: { kind: 'lastDay' },
    futureYou: 2_000_000,
    startedOn,
  });
  await store.load(today);
  return { store, actions: planActions(store), sqlite };
}

const pot = {
  name: 'Japan',
  icon: 'flight',
  hue: 200,
  goal: 3_000_000,
  neededBy: '2026-12',
};

const moveCount = (sqlite: InstanceType<typeof DatabaseSync>, kind: string) =>
  (sqlite.prepare('SELECT COUNT(*) AS n FROM pot_moves WHERE kind = ?').get(kind) as { n: number })
    .n;

describe('pot set-aside', () => {
  it('records the month into the pot the moment it is made, and the daily number moves', async () => {
    const { store, actions } = await open('2026-10-11');
    const before = dayOf(store.getSnapshot())?.startFree ?? 0;
    const made = await actions.createPot(pot);
    const snap = store.getSnapshot();
    expect(snap.potSaved[made.id]).toBe(1_500_000);
    expect(snap.setAsideThisCycle[made.id]).toBe(1_500_000);
    expect(dayOf(snap)?.startFree).toBe(before - 1_500_000);
  });

  it('never records a cycle twice, however often the app loads', async () => {
    const { store, actions, sqlite } = await open('2026-10-11');
    await actions.createPot(pot);
    await store.load('2026-10-11');
    await store.load('2026-10-20');
    expect(moveCount(sqlite, 'setAside')).toBe(1);
  });

  it('keeps the daily number fixed through the 1st of a month in the middle of a cycle', async () => {
    const { store, actions } = await open('2026-09-28');
    await actions.updateMonth({ payday: { kind: 'sameDay', day: 25 } });
    await actions.createPot(pot);
    const a = dayOf(store.getSnapshot())?.startFree;
    await store.load('2026-10-02');
    // A day later in the same cycle, nothing was spent: the pot still takes the same amount.
    expect(store.getSnapshot().setAsideThisCycle).toEqual(
      expect.objectContaining({ [store.getSnapshot().pots[0]?.id ?? '']: 1_500_000 }),
    );
    expect(dayOf(store.getSnapshot())?.startFree).toBe(a);
  });

  it('puts the next month in on payday and stops when the pot is full', async () => {
    const { store, actions } = await open('2026-10-11');
    const made = await actions.createPot(pot);
    await store.load('2026-10-31');
    expect(store.getSnapshot().potSaved[made.id]).toBe(3_000_000);
    await store.load('2026-11-30');
    expect(store.getSnapshot().potSaved[made.id]).toBe(3_000_000);
    expect(store.getSnapshot().setAsideThisCycle[made.id]).toBe(0);
  });

  it('catches up the cycles a long absence skipped', async () => {
    const { store, actions, sqlite } = await open('2026-10-11');
    const made = await actions.createPot({ ...pot, goal: 6_000_000, neededBy: '2027-03' });
    await store.load('2027-01-15');
    // 1tr a month from the cycle of October: Oct, Nov, Dec and Jan cycles are all recorded.
    expect(moveCount(sqlite, 'setAside')).toBe(4);
    expect(store.getSnapshot().potSaved[made.id]).toBeGreaterThan(1_200_000);
  });

  it('counts a top-up in the pot and out of free money, but not in the cycle’s set-aside', async () => {
    const { store, actions } = await open('2026-10-11');
    const made = await actions.createPot(pot);
    await actions.topUp(made.id, 100_000);
    await store.load('2026-10-12');
    const snap = store.getSnapshot();
    expect(snap.potSaved[made.id]).toBe(1_600_000);
    expect(snap.setAsideThisCycle[made.id]).toBe(1_500_000);
    expect(snap.topUpsThisCycle).toBe(100_000);
  });

  it('changes the cycle’s set-aside when the pot is edited, and pausing frees the money', async () => {
    const { store, actions } = await open('2026-10-11');
    const made = await actions.createPot(pot);
    await actions.updatePot(made.id, { goal: 2_000_000 });
    expect(store.getSnapshot().setAsideThisCycle[made.id]).toBe(1_000_000);
    await actions.updatePot(made.id, { paused: true });
    expect(store.getSnapshot().setAsideThisCycle[made.id]).toBe(0);
    await actions.updatePot(made.id, { paused: false });
    expect(store.getSnapshot().setAsideThisCycle[made.id]).toBe(1_000_000);
  });

  it('gives the money back when a pot is deleted, and takes it again when restored', async () => {
    const { store, actions } = await open('2026-10-11');
    const before = dayOf(store.getSnapshot())?.startFree ?? 0;
    const made = await actions.createPot(pot);
    await actions.archivePot(made.id);
    expect(dayOf(store.getSnapshot())?.startFree).toBe(before);
    expect(store.getSnapshot().pots).toHaveLength(0);
    await actions.restorePot(made.id);
    expect(dayOf(store.getSnapshot())?.startFree).toBe(before - 1_500_000);
  });
});

describe('Future you goals', () => {
  const goal = { ...pot, kind: 'goal' as const, name: 'Cushion', goal: 15_000_000, neededBy: null };

  it('are created with a share of Future you and fill from it each cycle', async () => {
    const { store, actions } = await open('2026-10-11');
    const made = await actions.createPot(goal);
    expect(made.share).toBe(1);
    expect(store.getSnapshot().potSaved[made.id]).toBe(2_000_000);
    // A goal is paid out of Future you: the daily number does not change when one is made.
    const dayWith = dayOf(store.getSnapshot())?.startFree;
    await actions.archivePot(made.id);
    expect(dayOf(store.getSnapshot())?.startFree).toBe(dayWith);
  });

  it('share Future you between them and give way when one is set', async () => {
    const { store, actions } = await open('2026-10-11');
    const a = await actions.createPot(goal);
    const b = await actions.createPot({ ...goal, name: 'Japan', share: 0.4 });
    const shares = () => Object.fromEntries(store.getSnapshot().pots.map((p) => [p.id, p.share]));
    expect(shares()).toEqual({ [a.id]: 0.6, [b.id]: 0.4 });
    expect(store.getSnapshot().setAsideThisCycle[a.id]).toBe(1_200_000);
    await actions.updatePot(b.id, { share: 0.7 });
    expect(shares()).toEqual({ [a.id]: 0.3, [b.id]: 0.7 });
    expect(store.getSnapshot().setAsideThisCycle[b.id]).toBe(1_400_000);
    await actions.archivePot(b.id);
    expect(shares()).toEqual({ [a.id]: 1 });
  });

  it('give their shares back when a deleted goal is restored, adding up to one again', async () => {
    const { store, actions } = await open('2026-10-11');
    const a = await actions.createPot(goal);
    const b = await actions.createPot({ ...goal, name: 'Japan', share: 0.4 });
    const c = await actions.createPot({ ...goal, name: 'Car', share: 0.2 });
    const shares = () => Object.fromEntries(store.getSnapshot().pots.map((p) => [p.id, p.share]));
    const total = () => Object.values(shares()).reduce<number>((sum, x) => sum + (x ?? 0), 0);
    const before = shares();
    await actions.archivePot(b.id);
    expect(total()).toBeCloseTo(1, 10);
    await actions.restorePot(b.id);
    expect(total()).toBeCloseTo(1, 10);
    expect(shares()).toEqual(before);
    // What the goals set aside this cycle still adds up to Future you, not more.
    const setAside = Object.values(store.getSnapshot().setAsideThisCycle).reduce(
      (x, y) => x + y,
      0,
    );
    expect(setAside).toBe(2_000_000);
    expect(shares()[a.id]).toBe(before[a.id]);
    expect(shares()[c.id]).toBe(0.2);
  });

  it('follow the what-if when Future you changes', async () => {
    const { store, actions } = await open('2026-10-11');
    const made = await actions.createPot(goal);
    await actions.setFutureYou(1_000_000);
    expect(store.getSnapshot().setAsideThisCycle[made.id]).toBe(1_000_000);
  });
});

describe('updateMonth', () => {
  it('moves the running cycle with its records when payday changes', async () => {
    const { store, actions, sqlite } = await open('2026-10-11');
    await actions.createPot(pot);
    await actions.updateMonth({ payday: { kind: 'sameDay', day: 25 } });
    expect(store.getSnapshot().cycle.start).toBe('2026-09-25');
    expect(moveCount(sqlite, 'setAside')).toBe(1);
    expect(Object.values(store.getSnapshot().setAsideThisCycle)).toEqual([1_500_000]);
  });
});
