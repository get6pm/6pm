import { useMemo } from 'react';

import { billPaidBy, billUnpaid, REPAYMENT, type BillRow } from '@6pm/domain';

import { useMoneyStore } from './money-provider';
import type { MoneyStore } from './money-store';
import { inTurn } from './store-queue';

/**
 * Spends that paid a bill. A spend said to be a bill's payment marks the bill paid this cycle and
 * is kept out of the daily number; one that paid a card or loan with no bill (`REPAYMENT`) only
 * leaves the daily number. Each commits, then reloads the snapshot so every number moves together.
 */
export function billPayments(store: MoneyStore) {
  const { tables, db } = store;
  const reload = () => store.loadInTurn(store.getSnapshot().today);

  /** The bill back to due, when this cycle's payment was the one being taken back. */
  const unpay = async (billId: string, cycleStart: string) => {
    const bill = await tables.bills.get(billId);
    if (bill && bill.paidCycle === cycleStart) await tables.bills.put({ ...bill, ...billUnpaid() });
  };

  return inTurn(store.exclusive, {
    /**
     * Says what a spend paid: a bill's id, `REPAYMENT`, or null for ordinary spending again (which
     * puts a bill it had paid back to due). Answering about a bill counts as the close's one
     * question about it this cycle.
     */
    setPaysBill: async (spendId: string, target: string | null) => {
      const { cycle } = store.getSnapshot();
      const spend = await tables.spends.get(spendId);
      if (!spend) return;
      const before = spend.paysBill ?? null;
      if (before === target) return;
      await db.withTransactionAsync(async () => {
        // Only a payment in this cycle can have paid this cycle's bill, or pay it now.
        const inCycle = spend.day >= cycle.start;
        if (inCycle && before !== null && before !== REPAYMENT) await unpay(before, cycle.start);
        if (inCycle && target !== null && target !== REPAYMENT) {
          const bill = await tables.bills.get(target);
          if (bill) {
            const next: BillRow = {
              ...bill,
              ...billPaidBy(bill, spend.amount, cycle),
              askedCycle: cycle.start,
            };
            await tables.bills.put(next);
          }
        }
        await tables.spends.put({
          ...spend,
          paysBill: target,
          updatedAt: new Date().toISOString(),
        });
      });
      await reload();
    },

    /** "No" to "Is this your {bill}?": the close does not ask about that bill again this cycle. */
    billAsked: async (billId: string) => {
      const { cycle } = store.getSnapshot();
      const bill = await tables.bills.get(billId);
      if (!bill || bill.askedCycle === cycle.start) return;
      await tables.bills.put({ ...bill, askedCycle: cycle.start });
      await reload();
    },
  });
}

export type BillPayments = ReturnType<typeof billPayments>;

export function useBillPayments(): BillPayments {
  const store = useMoneyStore();
  return useMemo(() => billPayments(store), [store]);
}
