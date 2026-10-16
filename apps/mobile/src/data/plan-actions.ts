import { randomUUID } from 'expo-crypto';
import { useMemo } from 'react';

import { payCycleOn, rebalanceShares, type BillRow, type Payday, type PotRow } from '@6pm/domain';

import { useMoneyStore } from './money-provider';
import type { MoneyStore } from './money-store';
import { writePlan } from './plan-settings';
import { clearCycleSetAside, moveCycleRecords, writeOpening } from './pot-moves';
import { inTurn } from './store-queue';

export interface NewBill {
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
  readonly amount: number;
  readonly dueDay: number;
}

export interface NewPot {
  /** An occasion pot, or a Future you goal; occasion when left out. */
  readonly kind?: PotRow['kind'];
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
  readonly goal: number;
  /** 'YYYY-MM' it should be full by; null for "no date". */
  readonly neededBy: string | null;
  /** A goal's share of Future you (0–1); the other goals give way to it. */
  readonly share?: number;
  /** What it already holds before 6pm ("Already saved"); none when left out. */
  readonly opening?: number;
}

/** What the edit sheet changes on a pot; `opening` is what it held before 6pm. */
export type PotPatch = Partial<
  Pick<PotRow, 'name' | 'icon' | 'hue' | 'goal' | 'neededBy' | 'paused' | 'share'> & {
    opening: number;
  }
>;

/** Changes that reach this cycle's set-aside (as does what it held before 6pm); a rename does not. */
const SET_ASIDE_FIELDS = ['goal', 'neededBy', 'paused', 'share'] as const;

/**
 * The Plan tab's writes: bills paid, edited and removed, pots made, edited, topped up and removed,
 * Future you's monthly amount, and the month's income and payday. Each commits to the database
 * first, then reloads the snapshot, so every number moves together.
 */
export function planActions(store: MoneyStore) {
  const { tables, db } = store;
  // Every action below runs in the store's turn, so its reload is the one that is already in turn.
  const reload = () => store.loadInTurn(store.getSnapshot().today);

  const putBill = async (row: BillRow) => {
    await tables.bills.put(row);
    const snap = store.getSnapshot();
    const bills = snap.bills.some((b) => b.id === row.id)
      ? snap.bills.map((b) => (b.id === row.id ? row : b))
      : [...snap.bills, row];
    store.publish({ ...snap, bills });
  };

  /** Makes this cycle's set-aside for the pots work itself out again from the pots as they are. */
  const refreshSetAsides = async (potIds: readonly string[]) => {
    const { start } = store.getSnapshot().cycle;
    for (const id of potIds) await clearCycleSetAside(db, id, start);
  };

  const goalShares = (pots: readonly PotRow[]) =>
    Object.fromEntries(pots.filter((p) => p.kind === 'goal').map((p) => [p.id, p.share ?? 0]));

  /** Writes the new shares of the goals whose share moved. */
  const putShares = async (pots: readonly PotRow[], shares: Readonly<Record<string, number>>) => {
    const moved: string[] = [];
    for (const pot of pots) {
      const share = shares[pot.id];
      if (pot.kind !== 'goal' || share === undefined || share === pot.share) continue;
      await tables.pots.put({ ...pot, share });
      moved.push(pot.id);
    }
    return moved;
  };

  return inTurn(store.exclusive, {
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
      if (!bill) return;
      await putBill({
        ...bill,
        ...patch,
        ...(patch.amount === undefined ? {} : { amount: Math.round(patch.amount) }),
      });
    },
    /** Takes a bill off the list; the amount returns to free money. `restoreBill` undoes it. */
    removeBill: async (id: string) => {
      const bill = await tables.bills.get(id);
      if (!bill) return;
      await tables.bills.put({ ...bill, archivedAt: new Date().toISOString() });
      const snap = store.getSnapshot();
      store.publish({ ...snap, bills: snap.bills.filter((b) => b.id !== id) });
    },
    restoreBill: async (id: string) => {
      const bill = await tables.bills.get(id);
      if (bill) await putBill({ ...bill, archivedAt: null });
    },

    /**
     * Starts an occasion pot or a Future you goal. Its first month's set-aside is recorded at
     * once, so the daily number moves as the sheet promised.
     */
    createPot: async (input: NewPot): Promise<PotRow> => {
      const snap = store.getSnapshot();
      const kind = input.kind ?? 'occasion';
      const row: PotRow = {
        id: randomUUID(),
        kind,
        name: input.name.trim(),
        icon: input.icon,
        hue: input.hue,
        goal: Math.round(input.goal),
        neededBy: input.neededBy,
        share: kind === 'goal' ? (input.share ?? 1) : null,
        paused: false,
        createdAt: new Date().toISOString(),
        archivedAt: null,
      };
      await db.withTransactionAsync(async () => {
        await tables.pots.put(row);
        await writeOpening(db, row.id, input.opening ?? 0, snap.cycle.start);
        if (kind === 'goal') {
          const shares = rebalanceShares(
            { ...goalShares(snap.pots), [row.id]: row.share ?? 1 },
            row.id,
          );
          const moved = await putShares([...snap.pots, row], shares);
          await refreshSetAsides(moved.filter((id) => id !== row.id));
        }
      });
      await reload();
      return row;
    },

    /** The edit sheet's save: details, goal, date, pause, and a goal's share of Future you. */
    updatePot: async (id: string, { opening, ...patch }: PotPatch) => {
      const snap = store.getSnapshot();
      const pot = snap.pots.find((p) => p.id === id);
      if (!pot) return;
      const next: PotRow = {
        ...pot,
        ...patch,
        name: patch.name === undefined ? pot.name : patch.name.trim() || pot.name,
        goal: patch.goal === undefined ? pot.goal : Math.max(0, Math.round(patch.goal)),
      };
      const touched = new Set<string>();
      await db.withTransactionAsync(async () => {
        await tables.pots.put(next);
        if (opening !== undefined) await writeOpening(db, id, opening, snap.cycle.start);
        if (SET_ASIDE_FIELDS.some((field) => field in patch) || opening !== undefined) {
          touched.add(id);
        }
        if (pot.kind === 'goal' && typeof patch.share === 'number' && patch.share !== pot.share) {
          const shares = rebalanceShares({ ...goalShares(snap.pots), [id]: patch.share }, id);
          for (const moved of await putShares(
            snap.pots.filter((p) => p.id !== id),
            shares,
          )) {
            touched.add(moved);
          }
          await tables.pots.put({ ...next, share: shares[id] ?? patch.share });
        }
        await refreshSetAsides([...touched]);
      });
      await reload();
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

    /**
     * Deletes a pot: it leaves the Plan and the daily number, and what it held (only ever a count)
     * goes back into free money. `restorePot` undoes it.
     */
    archivePot: async (id: string) => {
      const pot = await tables.pots.get(id);
      if (!pot) return;
      await tables.pots.put({ ...pot, archivedAt: new Date().toISOString() });
      if (pot.kind === 'goal') {
        const rest = store.getSnapshot().pots.filter((p) => p.id !== id);
        const shares = rebalanceShares(goalShares(rest));
        await refreshSetAsides(await putShares(rest, shares));
      }
      await reload();
    },
    restorePot: async (id: string) => {
      const pot = await tables.pots.get(id);
      if (!pot) return;
      const touched: string[] = [];
      await db.withTransactionAsync(async () => {
        await tables.pots.put({ ...pot, archivedAt: null });
        if (pot.kind !== 'goal') return;
        // The goals that took its share when it went give it back: the shares add up to one again.
        const rest = store.getSnapshot().pots.filter((p) => p.id !== id);
        const shares = rebalanceShares({ ...goalShares(rest), [id]: pot.share ?? 0 }, id);
        touched.push(...(await putShares(rest, shares)));
        const share = shares[id];
        if (share !== undefined && share !== pot.share) {
          await tables.pots.put({ ...pot, archivedAt: null, share });
          touched.push(id);
        }
        await refreshSetAsides(touched);
      });
      await reload();
    },

    /** Commits the what-if: Future you's monthly amount, which moves every number. */
    setFutureYou: async (amount: number) => {
      const snap = store.getSnapshot();
      if (!snap.plan || snap.plan.futureYou === amount) return;
      const plan = { ...snap.plan, futureYou: Math.max(0, Math.round(amount)) };
      await writePlan(db, plan);
      // The goals split Future you, so this cycle's share of it is worked out again.
      await refreshSetAsides(snap.pots.filter((p) => p.kind === 'goal').map((p) => p.id));
      await reload();
    },

    /**
     * Changes what the month is built on. A new payday moves the cycle that is running to its new
     * start, with what was recorded in it (pots, paid bills), so nothing counts twice.
     */
    updateMonth: async (patch: { income?: number; payday?: Payday }) => {
      const snap = store.getSnapshot();
      if (!snap.plan) return;
      const plan = {
        ...snap.plan,
        ...(patch.income === undefined ? {} : { income: Math.max(0, Math.round(patch.income)) }),
        ...(patch.payday === undefined ? {} : { payday: patch.payday }),
      };
      await db.withTransactionAsync(async () => {
        await writePlan(db, plan);
        await moveCycleRecords(db, snap.cycle.start, payCycleOn(snap.today, plan.payday).start);
      });
      await reload();
    },
  });
}

export type PlanActions = ReturnType<typeof planActions>;

export function usePlanActions(): PlanActions {
  const store = useMoneyStore();
  return useMemo(() => planActions(store), [store]);
}
