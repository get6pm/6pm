import type { MoneyStore } from './money-store';
import { readPlan, writePlan } from './plan-settings';

/**
 * Keeps what the person says they spent between payday and setting 6pm up, from Plan's "Before
 * 6pm", then reloads so every number moves with it. It only counts in the cycle they joined.
 */
export function setSpentSincePayday(store: MoneyStore, amount: number): Promise<void> {
  return store.exclusive(async () => {
    const plan = await readPlan(store.db);
    if (plan === null) return;
    await writePlan(store.db, { ...plan, spentSincePayday: Math.max(0, Math.round(amount)) });
    await store.loadInTurn(store.getSnapshot().today);
  });
}
