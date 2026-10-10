import { randomUUID } from 'expo-crypto';

import { filingDay, hourOf, type ClosedDayRow, type SpendRow } from '@6pm/domain';

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

/**
 * Every write the app makes to its money. Each one commits to the database first, then publishes
 * the new snapshot, so the screen never shows a state the phone has not saved.
 */
export function moneyActions(store: MoneyStore) {
  const { tables } = store;

  const replaceSpend = (row: SpendRow) => {
    const snap = store.getSnapshot();
    const others = snap.cycleSpends.filter((s) => s.id !== row.id);
    const cycleSpends =
      row.status === 'deleted'
        ? others
        : [row, ...others].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    store.publish({ ...snap, cycleSpends });
  };

  const addSpend = async (input: NewSpend): Promise<SpendRow> => {
    const at = input.at ?? new Date();
    const now = new Date().toISOString();
    const day = filingDay(store.getSnapshot().today, hourOf(at));
    const row: SpendRow = {
      id: randomUUID(),
      day,
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

  const update = async (id: string, patch: Partial<SpendRow>): Promise<SpendRow | null> => {
    const current = await tables.spends.get(id);
    if (!current) return null;
    const next: SpendRow = { ...current, ...patch, updatedAt: new Date().toISOString() };
    await tables.spends.put(next);
    replaceSpend(next);
    return next;
  };

  return {
    addSpend,
    update,
    /** Keep, not mine, delete: remembers the old status so the undo pill can put it back. */
    setStatus: (id: string, status: SpendRow['status']) =>
      tables.spends
        .get(id)
        .then((current) =>
          current ? update(id, { status, previousStatus: current.status }) : null,
        ),
    undo: (id: string) =>
      tables.spends
        .get(id)
        .then((current) =>
          current?.previousStatus
            ? update(id, { status: current.previousStatus, previousStatus: null })
            : null,
        ),
    /** "Was this one for work?" — a work spend moves to Claim back, out of the daily number. */
    markForWork: (id: string, forWork: boolean) => update(id, { forWork }),
    /** "Always file Circle K as Shopping": the next catch from this merchant gets this category. */
    rememberMerchant: async (merchant: string, categoryId: string) => {
      const merchantKey = merchant.trim().toLowerCase();
      const existing = await tables.rules.get(merchantKey);
      await tables.rules.put({
        merchantKey,
        merchant: merchant.trim(),
        categoryId,
        learnedTimes: existing?.learnedTimes ?? 0,
        setByUser: true,
      });
    },
    /** Files the day's receipt: the Diary, the week strip and the streak read it. */
    closeDay: async (row: ClosedDayRow) => {
      await tables.closedDays.put(row);
      const snap = store.getSnapshot();
      store.publish({
        ...snap,
        closedDays: [...snap.closedDays.filter((d) => d.day !== row.day), row].sort((a, b) =>
          a.day < b.day ? -1 : 1,
        ),
      });
    },
  };
}

export type MoneyActions = ReturnType<typeof moneyActions>;
