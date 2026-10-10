import type { MoneyStore } from './money-store';
import { DEFAULT_PLAN, writePlan, type PlanSettings } from './plan-settings';

/** Children before parents, so the foreign keys never see an orphan mid-wipe. */
const EVERY_TABLE = [
  'spend_sightings',
  'pot_moves',
  'spends',
  'merchant_rules',
  'bills',
  'pots',
  'categories',
  'closed_days',
  'settings',
] as const;

/**
 * The Settings sheet's writes. A plan change commits first and then reloads, so Today, the close
 * and the theme all move together; deleting everything leaves the phone as it was on first launch.
 */
export function settingsActions(store: MoneyStore) {
  const { db } = store;
  const reload = () => store.load(store.getSnapshot().today);

  return {
    updatePlan: async (patch: Partial<PlanSettings>) => {
      await writePlan(db, { ...(store.getSnapshot().plan ?? DEFAULT_PLAN), ...patch });
      await reload();
    },
    deleteAll: async () => {
      await db.withTransactionAsync(async () => {
        for (const table of EVERY_TABLE) await db.runAsync(`DELETE FROM ${table}`, []);
      });
      await reload();
    },
  };
}
