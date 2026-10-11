import { randomUUID } from 'expo-crypto';

import {
  findDuplicate,
  learnedRule,
  mergedStatus,
  merchantKeyOf,
  moneyDayOf,
  type ClosedDayRow,
  type SpendRow,
} from '@6pm/domain';

import type { MoneyStore } from './money-store';

export interface NewSpend {
  readonly amount: number;
  readonly categoryId: string;
  readonly merchant: string;
  readonly source: SpendRow['source'];
  /** Spends the user enters are kept at once; ones 6pm catches wait for the close. */
  readonly status: 'kept' | 'caught' | 'pending';
  readonly note?: string | null;
  readonly wallet?: string | null;
  readonly detail?: string | null;
  readonly foreignAmount?: SpendRow['foreignAmount'];
  /** When it happened; now unless the source says otherwise. */
  readonly at?: Date;
}

/** One way a spend was seen: the source trail on Details. */
export interface Sighting {
  readonly source: SpendRow['source'];
  readonly seenAt: string;
  readonly detail: string | null;
}

/** What an undo puts back besides the status: the amount and category an edit changed. */
export type UndoRestore = Partial<Pick<SpendRow, 'amount' | 'categoryId'>>;

/**
 * Every write the app makes to its money. Each one commits to the database first, then publishes
 * the new snapshot, so the screen never shows a state the phone has not saved.
 */
export function moneyActions(store: MoneyStore) {
  const { tables } = store;

  // Writes run one after another: each reads the row as the one before it left it, so two quick
  // edits to the same spend (an amount, then a status) never overwrite each other.
  let queue: Promise<unknown> = Promise.resolve();
  const inTurn = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task);
    queue = run.catch(() => undefined);
    return run;
  };

  const replaceSpend = (row: SpendRow) => {
    const snap = store.getSnapshot();
    const others = snap.cycleSpends.filter((s) => s.id !== row.id);
    // A row outside the loaded pay cycle (a waiting item from before payday) is saved but not shown.
    const inCycle = row.day >= snap.cycle.start && row.day <= snap.today;
    const cycleSpends =
      row.status === 'deleted' || !inCycle
        ? others
        : [row, ...others].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    store.publish({ ...snap, cycleSpends });
  };

  /** The row as the screen holds it, else as the database does (one read, not two). */
  const current = async (id: string): Promise<SpendRow | null> =>
    store.getSnapshot().cycleSpends.find((s) => s.id === id) ?? (await tables.spends.get(id));

  const patchNow = async (row: SpendRow, patch: Partial<SpendRow>): Promise<SpendRow> => {
    const next: SpendRow = { ...row, ...patch, updatedAt: new Date().toISOString() };
    await tables.spends.put(next);
    replaceSpend(next);
    return next;
  };

  const update = (id: string, patch: Partial<SpendRow>): Promise<SpendRow | null> =>
    inTurn(async () => {
      const row = await current(id);
      return row ? patchNow(row, patch) : null;
    });

  /** The same payment seen a second way: one item, its sightings recorded, never two rows. */
  const mergeInto = async (twin: SpendRow, input: NewSpend, seenAt: string): Promise<SpendRow> => {
    const next: SpendRow = {
      ...twin,
      status: mergedStatus(twin.status, input.status),
      note: twin.note ?? input.note ?? null,
      wallet: twin.wallet ?? input.wallet ?? null,
      updatedAt: new Date().toISOString(),
    };
    await store.db.withTransactionAsync(async () => {
      const insert =
        'INSERT OR IGNORE INTO spend_sightings (spend_id, source, seen_at, detail) VALUES (?, ?, ?, ?)';
      // The first sighting was never written on its own; it is part of the trail from now on.
      await store.db.runAsync(insert, [twin.id, twin.source, twin.at, twin.detail]);
      await store.db.runAsync(insert, [twin.id, input.source, seenAt, input.detail ?? null]);
      await tables.spends.put(next);
    });
    replaceSpend(next);
    return next;
  };

  const addNow = async (input: NewSpend): Promise<SpendRow> => {
    const at = input.at ?? new Date();
    const snap = store.getSnapshot();
    const twin = findDuplicate(
      { amount: Math.round(input.amount), source: input.source, at: at.toISOString() },
      snap.cycleSpends,
    );
    if (twin) {
      const row = snap.cycleSpends.find((s) => s.id === twin.id);
      if (row) return mergeInto(row, input, at.toISOString());
    }
    const now = new Date().toISOString();
    const row: SpendRow = {
      id: randomUUID(),
      // Captured now, it belongs to the day the screens are showing; a recorded time files itself.
      day: input.at ? moneyDayOf(input.at) : snap.today,
      at: at.toISOString(),
      amount: Math.round(input.amount),
      categoryId: input.categoryId,
      merchant: input.merchant,
      note: input.note ?? null,
      source: input.source,
      status: input.status,
      previousStatus: null,
      wallet: input.wallet ?? null,
      forWork: false,
      detail: input.detail ?? null,
      foreignAmount: input.foreignAmount ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await tables.spends.put(row);
    replaceSpend(row);
    return row;
  };

  return {
    addSpend: (input: NewSpend) => inTurn(() => addNow(input)),
    update,
    /**
     * Keep, not mine, delete: remembers the old status so the undo pill can put it back. An edit
     * made in the same breath (the close's "Save and keep") goes in the same write.
     */
    setStatus: (
      id: string,
      status: SpendRow['status'],
      edit: UndoRestore = {},
    ): Promise<SpendRow | null> =>
      inTurn(async () => {
        const row = await current(id);
        if (!row) return null;
        // Saying the same thing twice (a double tap) must not overwrite what undo would restore.
        if (row.status === status) return Object.keys(edit).length > 0 ? patchNow(row, edit) : row;
        return patchNow(row, { ...edit, status, previousStatus: row.status });
      }),
    /** Puts back the status before the last change, and the amount and category an edit changed. */
    undo: (id: string, restore: UndoRestore = {}): Promise<SpendRow | null> =>
      inTurn(async () => {
        const row = await current(id);
        return row?.previousStatus
          ? patchNow(row, { ...restore, status: row.previousStatus, previousStatus: null })
          : null;
      }),
    /** "Was this one for work?" — a work spend moves to Claim back, out of the daily number. */
    markForWork: (id: string, forWork: boolean) => update(id, { forWork }),
    /** The category a saved rule files this merchant under, or null when none applies. */
    ruleCategory: async (merchant: string): Promise<string | null> => {
      if (merchant.trim() === '') return null;
      const rule = await tables.rules.get(merchantKeyOf(merchant));
      return rule && store.getSnapshot().categories.some((c) => c.id === rule.categoryId)
        ? rule.categoryId
        : null;
    },
    /** "Always file Circle K as Shopping": the next catch from this merchant gets this category. */
    rememberMerchant: (merchant: string, categoryId: string) =>
      inTurn(async () => {
        const existing = await tables.rules.get(merchantKeyOf(merchant));
        await tables.rules.put(learnedRule(existing, merchant, categoryId));
      }),
    /** Every way a spend was seen, oldest first. Empty for a spend seen only once. */
    sightings: async (spendId: string): Promise<Sighting[]> => {
      const rows = await store.db.getAllAsync<{
        source: SpendRow['source'];
        seen_at: string;
        detail: string | null;
      }>(
        'SELECT source, seen_at, detail FROM spend_sightings WHERE spend_id = ? ORDER BY seen_at',
        [spendId],
      );
      return rows.map((r) => ({ source: r.source, seenAt: r.seen_at, detail: r.detail }));
    },
    /** Files the day's receipt: the Diary, the week strip and the streak read it. */
    closeDay: (row: ClosedDayRow) =>
      inTurn(async () => {
        await tables.closedDays.put(row);
        const snap = store.getSnapshot();
        store.publish({
          ...snap,
          closedDays: [...snap.closedDays.filter((d) => d.day !== row.day), row].sort((a, b) =>
            a.day < b.day ? -1 : 1,
          ),
        });
      }),
    /** How many days were closed before `day`: its receipt is the next number. */
    closedBefore: async (day: string): Promise<number> => {
      const rows = await store.db.getAllAsync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM closed_days WHERE day < ?',
        [day],
      );
      return rows[0]?.n ?? 0;
    },
  };
}

export type MoneyActions = ReturnType<typeof moneyActions>;
