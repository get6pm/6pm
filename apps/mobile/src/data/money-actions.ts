import { randomUUID } from 'expo-crypto';

import {
  findDuplicate,
  learnedRule,
  mergedStatus,
  merchantKeyOf,
  moneyDayOf,
  settleTypedAmount,
  type ClosedDayRow,
  type LocalDate,
  type SpendRow,
} from '@6pm/domain';

import { homeCurrencyOf } from '../money/use-money-format';

import { findSpend, type MoneyStore } from './money-store';

export interface NewSpend {
  /** Set when the capture already has one (an inbox item), so importing it twice finds it. */
  readonly id?: string;
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
  /** The receipt printed no currency and the one saved was guessed. */
  readonly currencyGuessed?: boolean;
  /** When it happened; now unless the source says otherwise. */
  readonly at?: Date;
  /**
   * The money day to file it under, when that is not the day the screens show: cash added to a
   * close that ran past 04:00 belongs to the day being closed.
   */
  readonly day?: LocalDate;
}

/**
 * What saving a capture did: a new row, or the sighting of a payment that was already there.
 * `before` is the row as it was ahead of a merge, so the sighting can be taken out again.
 */
export interface Capture {
  readonly row: SpendRow;
  readonly merged: boolean;
  readonly before: SpendRow | null;
  readonly sighting: { readonly source: SpendRow['source']; readonly seenAt: string };
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

  // Writes run one after another, and after any load in flight: each reads the row as the one
  // before it left it, so two quick edits to the same spend (an amount, then a status) never
  // overwrite each other, and a reload never publishes what it read before a write.
  const inTurn = store.exclusive;

  const newestFirst = (rows: readonly SpendRow[]) =>
    [...rows].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  const replaceSpend = (row: SpendRow) => {
    const snap = store.getSnapshot();
    const others = (list: readonly SpendRow[]) => list.filter((s) => s.id !== row.id);
    if (row.day < snap.cycle.start) {
      // A waiting item from before payday stays in the snapshot after it is answered (its details
      // and the close's running total still read it) until the next load drops it.
      const waitingBefore =
        row.status === 'deleted'
          ? others(snap.waitingBefore)
          : newestFirst([row, ...others(snap.waitingBefore)]);
      store.publish({ ...snap, waitingBefore });
      return;
    }
    const inCycle = row.day <= snap.today;
    const cycleSpends =
      row.status === 'deleted' || !inCycle
        ? others(snap.cycleSpends)
        : newestFirst([row, ...others(snap.cycleSpends)]);
    store.publish({ ...snap, cycleSpends });
  };

  /** The row as the screen holds it, else as the database does (one read, not two). */
  const current = async (id: string): Promise<SpendRow | null> =>
    findSpend(store.getSnapshot(), id) ?? (await tables.spends.get(id));

  const patchNow = async (row: SpendRow, patch: Partial<SpendRow>): Promise<SpendRow> => {
    const next: SpendRow = { ...row, ...patch, updatedAt: new Date().toISOString() };
    await tables.spends.put(next);
    replaceSpend(next);
    return next;
  };

  const update = (id: string, patch: Partial<SpendRow>): Promise<SpendRow | null> =>
    inTurn(async () => {
      const row = await current(id);
      if (!row) return null;
      const settled = settleTypedAmount(
        row.foreignAmount,
        patch,
        homeCurrencyOf(store.getSnapshot().plan),
      );
      return patchNow(row, settled === undefined ? patch : { ...patch, foreignAmount: settled });
    });

  /** The same payment seen a second way: one item, its sightings recorded, never two rows. */
  const mergeInto = async (twin: SpendRow, input: NewSpend, seenAt: string): Promise<Capture> => {
    const next: SpendRow = {
      ...twin,
      status: mergedStatus(twin.status, input.status),
      note: twin.note ?? input.note ?? null,
      wallet: twin.wallet ?? input.wallet ?? null,
      updatedAt: new Date().toISOString(),
    };
    await store.db.withTransactionAsync(async () => {
      const insert =
        'INSERT OR IGNORE INTO spend_sightings (spend_id, source, seen_at, detail, capture_id) VALUES (?, ?, ?, ?, ?)';
      // The first sighting was never written on its own; it is part of the trail from now on.
      await store.db.runAsync(insert, [twin.id, twin.source, twin.at, twin.detail, twin.id]);
      await store.db.runAsync(insert, [
        twin.id,
        input.source,
        seenAt,
        input.detail ?? null,
        input.id ?? null,
      ]);
      await tables.spends.put(next);
    });
    replaceSpend(next);
    return { row: next, merged: true, before: twin, sighting: { source: input.source, seenAt } };
  };

  const captureNow = async (input: NewSpend): Promise<Capture> => {
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
      id: input.id ?? randomUUID(),
      // Captured now, it belongs to the day the screens are showing; a recorded time files itself.
      day: input.day ?? (input.at ? moneyDayOf(input.at) : snap.today),
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
      currencyGuessed: input.currencyGuessed ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await tables.spends.put(row);
    replaceSpend(row);
    return { row, merged: false, before: null, sighting: { source: row.source, seenAt: row.at } };
  };

  /**
   * Takes back what a capture did and nothing else: a row it created is deleted; a payment it
   * only added a sighting to loses that sighting (and goes back to how it was, when nothing has
   * touched it since) and stays.
   */
  const withdrawNow = async (capture: Capture): Promise<SpendRow | null> => {
    const row = await current(capture.row.id);
    if (!row) return null;
    if (!capture.merged) return patchNow(row, { status: 'deleted', previousStatus: row.status });
    const { db } = store;
    const merged = capture.row;
    const untouched =
      capture.before !== null &&
      row.status === merged.status &&
      row.note === merged.note &&
      row.wallet === merged.wallet;
    const restored =
      untouched && capture.before
        ? { ...capture.before, updatedAt: new Date().toISOString() }
        : row;
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'DELETE FROM spend_sightings WHERE spend_id = ? AND source = ? AND seen_at = ?',
        [row.id, capture.sighting.source, capture.sighting.seenAt],
      );
      const left = await db.getAllAsync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM spend_sightings WHERE spend_id = ?',
        [row.id],
      );
      // A payment seen once has no trail: the first sighting is only kept alongside a second.
      if ((left[0]?.n ?? 0) <= 1) {
        await db.runAsync('DELETE FROM spend_sightings WHERE spend_id = ?', [row.id]);
      }
      if (restored !== row) await tables.spends.put(restored);
    });
    replaceSpend(restored);
    return restored;
  };

  return {
    addSpend: (input: NewSpend) => inTurn(async () => (await captureNow(input)).row),
    /** `addSpend`, also saying whether the payment merged into one already there. */
    captureSpend: (input: NewSpend) => inTurn(() => captureNow(input)),
    /** Takes back a capture (a cancelled payment) without touching anything it did not make. */
    withdrawCapture: (capture: Capture) => inTurn(() => withdrawNow(capture)),
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
