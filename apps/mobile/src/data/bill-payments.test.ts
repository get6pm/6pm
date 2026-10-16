import { describe, expect, it, jest } from '@jest/globals';

import { REPAYMENT, type BillRow } from '@6pm/domain';

import { openMemoryStore } from '../features/backup/test/memory-db';
import { billPayments } from './bill-payments';
import { dayOf } from './money-store';
import { DEFAULT_PLAN, writePlan } from './plan-settings';

jest.mock('./money-provider', () => ({ useMoneyStore: () => null }));

const TODAY = '2026-10-10';

const bill = (over: Partial<BillRow> & Pick<BillRow, 'id' | 'amount'>): BillRow => ({
  name: over.id,
  icon: 'credit_card',
  hue: 30,
  dueDay: 10,
  paidCycle: null,
  sort: 0,
  archivedAt: null,
  kind: 'other',
  lastMonth: null,
  paidAmount: null,
  askedCycle: null,
  ...over,
});

/** A month on payday the 25th, with `bills` and one payment caught by email today. */
async function monthWith(bills: readonly BillRow[], paid: number) {
  const store = openMemoryStore(TODAY);
  await writePlan(store.db, {
    ...DEFAULT_PLAN,
    income: 30_000_000,
    payday: { kind: 'sameDay', day: 25 },
    futureYou: 0,
    startedOn: '2026-09-01',
  });
  await store.tables.categories.put({
    id: 'shopping',
    name: 'Shopping',
    icon: 'local_mall',
    hue: 300,
    countsDaily: true,
    sort: 0,
    archivedAt: null,
  });
  for (const row of bills) await store.tables.bills.put(row);
  await store.load(TODAY);
  const before = dayOf(store.getSnapshot())?.free ?? 0;
  await store.tables.spends.put({
    id: 'statement',
    day: TODAY,
    at: `${TODAY}T03:00:00.000Z`,
    amount: paid,
    categoryId: 'shopping',
    merchant: 'THANH TOAN THE TIN DUNG',
    note: null,
    source: 'email',
    status: 'caught',
    previousStatus: null,
    wallet: null,
    forWork: false,
    detail: null,
    foreignAmount: null,
    createdAt: `${TODAY}T03:00:00.000Z`,
    updatedAt: `${TODAY}T03:00:00.000Z`,
  });
  await store.load(TODAY);
  return { store, actions: billPayments(store), before };
}

const freeOf = (store: ReturnType<typeof openMemoryStore>) => dayOf(store.getSnapshot())?.free;

describe('a spend that paid a bill', () => {
  it('a 2tr card bill and an 8tr statement, "Yes, my card": paid, free money unmoved', async () => {
    const { store, actions, before } = await monthWith(
      [bill({ id: 'card', amount: 2_000_000, kind: 'card' })],
      8_000_000,
    );
    expect(freeOf(store)).toBe(before - 8_000_000);
    await actions.setPaysBill('statement', 'card');
    expect(freeOf(store)).toBe(before);
    const card = store.getSnapshot().bills[0];
    expect(card?.paidCycle).toBe(store.getSnapshot().cycle.start);
    expect(card?.askedCycle).toBe(store.getSnapshot().cycle.start);
  });

  it('a 5tr bill paid 6tr: free money drops by 1tr once, and comes back when taken back', async () => {
    const { store, actions, before } = await monthWith(
      [bill({ id: 'power', amount: 5_000_000 })],
      6_000_000,
    );
    await actions.setPaysBill('statement', 'power');
    expect(freeOf(store)).toBe(before - 1_000_000);
    expect(store.getSnapshot().bills[0]?.paidAmount).toBe(6_000_000);
    await actions.setPaysBill('statement', null);
    expect(freeOf(store)).toBe(before - 6_000_000);
    expect(store.getSnapshot().bills[0]).toMatchObject({ paidCycle: null, paidAmount: null });
  });

  it('a card or loan with no bill: only out of the daily number', async () => {
    const { store, actions, before } = await monthWith([], 12_000_000);
    await actions.setPaysBill('statement', REPAYMENT);
    expect(freeOf(store)).toBe(before);
    expect(store.getSnapshot().cycleSpends[0]?.paysBill).toBe(REPAYMENT);
  });

  it('remembers a "No" so the close does not ask about that bill again this cycle', async () => {
    const { store, actions } = await monthWith([bill({ id: 'rent', amount: 5_000_000 })], 1);
    await actions.billAsked('rent');
    expect(store.getSnapshot().bills[0]?.askedCycle).toBe(store.getSnapshot().cycle.start);
  });

  it('leaves out a bill past its last month', async () => {
    const { store, before } = await monthWith(
      [bill({ id: 'phone', amount: 1_000_000, lastMonth: '2026-09' })],
      0,
    );
    expect(store.getSnapshot().bills).toEqual([]);
    expect(before).toBe(30_000_000);
  });
});
