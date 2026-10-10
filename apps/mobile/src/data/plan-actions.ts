import { randomUUID } from 'expo-crypto';
import { useMemo } from 'react';

import type { BillRow, PotRow } from '@6pm/domain';

import { useMoneyStore } from './money-provider';
import type { MoneyStore } from './money-store';
import { writePlan } from './plan-settings';

export interface NewBill {
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
  readonly amount: number;
  readonly dueDay: number;
}

export interface NewPot {
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
  readonly goal: number;
  /** 'YYYY-MM' it should be full by; null for "no date". */
  readonly neededBy: string | null;
}

/** Top-ups this pay cycle, split by where they went: the river shows each under its own colour. */
export interface CycleTopUps {
  readonly goal: number;
  readonly occasion: number;
}

/**
 * The Plan tab's writes: bills paid and edited, pots made, topped up and archived, and Future
 * you's monthly amount. Each commits to the database first, then publishes the new snapshot.
 */
export function planActions(store: MoneyStore) {
  const { tables, db } = store;

  const putBill = async (row: BillRow) => {
    await tables.bills.put(row);
    const snap = store.getSnapshot();
    const bills = snap.bills.some((b) => b.id === row.id)
      ? snap.bills.map((b) => (b.id === row.id ? row : b))
      : [...snap.bills, row];
    store.publish({ ...snap, bills });
  };

  return {
    /** Ticks a bill off for this pay cycle, or puts it back to due. */
    setBillPaid: async (id: string, paid: boolean) => {
      const snap = store.getSnapshot();
      const bill = snap.bills.find((b) => b.id === id);
      if (!bill) return;
      await putBill({ ...bill, paidCycle: paid ? snap.cycle.start : null });
    },
    addBill: async (input: NewBill) => {
      const snap = store.getSnapshot();
      await putBill({
        id: randomUUID(),
        ...input,
        amount: Math.round(input.amount),
        paidCycle: null,
        sort: snap.bills.reduce((max, b) => Math.max(max, b.sort + 1), 0),
        archivedAt: null,
      });
    },
    updateBill: async (id: string, patch: Partial<NewBill>) => {
      const bill = store.getSnapshot().bills.find((b) => b.id === id);
      if (bill) await putBill({ ...bill, ...patch });
    },

    /** Starts an occasion pot from the New pot sheet. */
    createPot: async (input: NewPot): Promise<PotRow> => {
      const row: PotRow = {
        id: randomUUID(),
        kind: 'occasion',
        name: input.name.trim(),
        icon: input.icon,
        hue: input.hue,
        goal: Math.round(input.goal),
        neededBy: input.neededBy,
        share: null,
        paused: false,
        createdAt: new Date().toISOString(),
        archivedAt: null,
      };
      await tables.pots.put(row);
      const snap = store.getSnapshot();
      store.publish({ ...snap, pots: [...snap.pots, row] });
      return row;
    },

    /** The +100k buttons: money moved into a goal or pot now, out of this cycle's free money. */
    topUp: async (potId: string, amount: number) => {
      const snap = store.getSnapshot();
      await db.runAsync(
        'INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          randomUUID(),
          potId,
          Math.round(amount),
          'topUp',
          snap.cycle.start,
          new Date().toISOString(),
        ],
      );
      store.publish({
        ...snap,
        potSaved: { ...snap.potSaved, [potId]: (snap.potSaved[potId] ?? 0) + Math.round(amount) },
        topUpsThisCycle: snap.topUpsThisCycle + Math.round(amount),
      });
    },

    archivePot: async (id: string) => {
      const pot = await tables.pots.get(id);
      if (!pot) return;
      await tables.pots.put({ ...pot, archivedAt: new Date().toISOString() });
      const snap = store.getSnapshot();
      store.publish({ ...snap, pots: snap.pots.filter((p) => p.id !== id) });
    },

    /** Commits the what-if: Future you's monthly amount, which moves every number. */
    setFutureYou: async (amount: number) => {
      const snap = store.getSnapshot();
      if (!snap.plan || snap.plan.futureYou === amount) return;
      const plan = { ...snap.plan, futureYou: Math.max(0, Math.round(amount)) };
      await writePlan(db, plan);
      store.publish({ ...store.getSnapshot(), plan });
    },
  };
}

export type PlanActions = ReturnType<typeof planActions>;

export function usePlanActions(): PlanActions {
  const store = useMoneyStore();
  return useMemo(() => planActions(store), [store]);
}

/** This cycle's top-ups by the kind of pot they went into. */
export async function readCycleTopUps(store: MoneyStore): Promise<CycleTopUps> {
  const rows = await store.db.getAllAsync<{ kind: string; total: number }>(
    `SELECT p.kind AS kind, SUM(m.amount) AS total FROM pot_moves m JOIN pots p ON p.id = m.pot_id
     WHERE m.kind = 'topUp' AND m.cycle = ? GROUP BY p.kind`,
    [store.getSnapshot().cycle.start],
  );
  const of = (kind: string) => rows.find((r) => r.kind === kind)?.total ?? 0;
  return { goal: of('goal'), occasion: of('occasion') };
}
