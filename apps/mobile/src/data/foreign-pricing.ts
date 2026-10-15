import { priceWaiting, RATE_PENDING, rateDayOf, waitingForeign, type LocalDate } from '@6pm/domain';

import type { moneyActions } from './money-actions';
import type { MoneyStore } from './money-store';

export interface ForeignPricingDeps {
  readonly store: MoneyStore;
  readonly actions: ReturnType<typeof moneyActions>;
  /**
   * The server's rates for a day (each currency's newest on or before it); null when they could
   * not be fetched.
   */
  readonly ratesOn: (
    day: LocalDate,
  ) => Promise<readonly { readonly currency: string; readonly rate: string }[] | null>;
  /** The last rate the phone kept for a currency, for when the day's cannot be fetched. */
  readonly lastRate: (currency: string) => string | null;
}

/**
 * Prices every captured foreign amount still waiting for a rate, at the rate of the day it was
 * paid (the newest the server has on or before it), else the last rate the phone kept. One that
 * still has no rate stays waiting, never 0₫ in silence. Shared receipts saved before the foreign
 * amount was kept (0₫, the printed amount in the note) are read back from the note and priced the
 * same way. Returns how many were priced.
 */
export async function priceWaitingForeign(deps: ForeignPricingDeps): Promise<number> {
  const { store, actions } = deps;
  const rows = await store.tables.spends.select("WHERE status != 'deleted' AND amount = 0", []);
  const days = new Map<LocalDate, ReturnType<ForeignPricingDeps['ratesOn']>>();
  const ratesOn = (day: LocalDate) => {
    const known = days.get(day);
    if (known) return known;
    const asked = deps.ratesOn(day).catch(() => null);
    days.set(day, asked);
    return asked;
  };
  let priced = 0;
  for (const row of rows) {
    const waiting = waitingForeign(row);
    if (!waiting) continue;
    const rates = await ratesOn(rateDayOf(new Date(row.at)));
    const rate =
      rates?.find((r) => r.currency === waiting.currency)?.rate ?? deps.lastRate(waiting.currency);
    const done = rate === null ? null : priceWaiting(waiting, rate);
    const fromNote = waiting.fromNote ? { note: null } : {};
    if (done) {
      await actions.update(row.id, { ...done, ...fromNote });
      priced += 1;
    } else if (waiting.fromNote) {
      // Still no rate: the printed amount moves from the note to a foreign amount that waits.
      const { currency, amount } = waiting;
      await actions.update(row.id, {
        foreignAmount: { currency, amount, rate: RATE_PENDING },
        note: null,
      });
    }
  }
  return priced;
}
