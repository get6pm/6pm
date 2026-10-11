import { randomUUID } from 'expo-crypto';
import { useMemo } from 'react';

import type { CategoryRow, MerchantRuleRow, SpendRow } from '@6pm/domain';

import { useMoneyStore } from './money-provider';
import type { MoneyStore } from './money-store';
import { inTurn } from './store-queue';

export interface CategoryInput {
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
  readonly countsDaily: boolean;
}

/** How much a category has carried this pay cycle: the spends still standing and their sum. */
export interface CategoryTally {
  readonly count: number;
  readonly total: number;
}

/** Each category's spends this cycle, skipped ones left out (deleted ones never reach the cycle). */
export function tallyByCategory(
  spends: readonly Pick<SpendRow, 'categoryId' | 'amount' | 'status'>[],
): ReadonlyMap<string, CategoryTally> {
  const tallies = new Map<string, CategoryTally>();
  for (const spend of spends) {
    if (spend.status === 'skipped' || spend.status === 'deleted') continue;
    const sofar = tallies.get(spend.categoryId) ?? { count: 0, total: 0 };
    tallies.set(spend.categoryId, { count: sofar.count + 1, total: sofar.total + spend.amount });
  }
  return tallies;
}

/** The category a deleted one's spends move to: the first other one in the user's order. */
export function fallbackFor(
  categories: readonly CategoryRow[],
  id: string,
): CategoryRow | undefined {
  return categories.find((c) => c.id !== id && c.archivedAt === null);
}

/**
 * The Categories sheet's writes. Rules and spends point at a category by id, so a rename or a new
 * icon re-files nothing; deleting moves every spend to the fallback and forgets the rules that
 * pointed at it. Each commits to the database first, then publishes or reloads the snapshot.
 */
export function categoryActions(store: MoneyStore) {
  const { tables, db } = store;

  const publishCategory = (row: CategoryRow) => {
    const snap = store.getSnapshot();
    const categories = snap.categories.some((c) => c.id === row.id)
      ? snap.categories.map((c) => (c.id === row.id ? row : c))
      : [...snap.categories, row];
    store.publish({ ...snap, categories });
  };

  return inTurn(store.exclusive, {
    /** Saves a new category (no id) or an edit of an existing one. Returns null for a blank name. */
    saveCategory: async (input: CategoryInput, id?: string): Promise<CategoryRow | null> => {
      const name = input.name.trim();
      if (name === '') return null;
      const current = id ? await tables.categories.get(id) : null;
      const all = current ? [] : await tables.categories.all();
      const row: CategoryRow = {
        id: current?.id ?? randomUUID(),
        name,
        icon: input.icon,
        hue: input.hue,
        countsDaily: input.countsDaily,
        sort: current?.sort ?? all.reduce((max, c) => Math.max(max, c.sort + 1), 0),
        archivedAt: current?.archivedAt ?? null,
      };
      await tables.categories.put(row);
      publishCategory(row);
      return row;
    },

    /**
     * Deletes a category: its spends, in every cycle, move to the fallback, its rules go, and the
     * row is archived so old receipts still resolve. The last category can never be deleted.
     */
    deleteCategory: async (id: string): Promise<CategoryRow | null> => {
      const active = await tables.categories.select('WHERE archived_at IS NULL ORDER BY sort', []);
      const to = fallbackFor(active, id);
      const gone = active.find((c) => c.id === id);
      if (!to || !gone) return null;
      const now = new Date().toISOString();
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          'UPDATE spends SET category_id = ?, updated_at = ? WHERE category_id = ?',
          [to.id, now, id],
        );
        await tables.rules.removeWhere('categoryId', id);
        await tables.categories.put({ ...gone, archivedAt: now });
      });
      await store.loadInTurn(store.getSnapshot().today);
      return to;
    },

    /** Every merchant rule that still points at a live category, by merchant name. */
    readRules: async (): Promise<MerchantRuleRow[]> =>
      tables.rules.select(
        'WHERE category_id IN (SELECT id FROM categories WHERE archived_at IS NULL) ORDER BY merchant COLLATE NOCASE',
        [],
      ),

    /** Forgets one merchant: the next catch from it goes back to being guessed. */
    removeRule: (merchantKey: string) => tables.rules.remove(merchantKey),
  });
}

export type CategoryActions = ReturnType<typeof categoryActions>;

export function useCategoryActions(): CategoryActions {
  const store = useMoneyStore();
  return useMemo(() => categoryActions(store), [store]);
}
