import { describe, expect, it } from 'vitest';

import type { CountedSpend } from '../spend/spend';
import {
  billPaidBy,
  billsThisCycle,
  billThisCycle,
  billUnpaid,
  lastMonthAfter,
  monthsLeftOf,
  type CycleBill,
} from './bills';
import { dailyNumber } from './daily-number';
import { payCycleOn, type PayCycle } from './pay-cycle';
import { addMonthsTo } from './plan-river';

const payday25 = { kind: 'sameDay', day: 25 } as const;
const october = payCycleOn('2026-10-10', payday25);

/** The month's free money right now, with `bills` off the plan and `spends` counted today. */
function freeWith(bills: readonly CycleBill[], spends: readonly CountedSpend[], cycle = october) {
  return dailyNumber({
    plan: {
      income: 30_000_000,
      bills: billsThisCycle(bills, cycle),
      futureYou: 0,
      occasions: 0,
      topUps: 0,
    },
    spentBefore: 0,
    today: spends,
    notDaily: new Set(),
    daysLeft: cycle.daysLeft,
  }).free;
}

const caught = (amount: number, paysBill: string | null = null): CountedSpend => ({
  amount,
  category: 'shopping',
  status: 'caught',
  paysBill,
});

describe('a bill with a last month', () => {
  it('comes off each cycle of a 12-month trả góp and stops after the twelfth', () => {
    const lastMonth = lastMonthAfter(october, 12, false);
    const instalment: CycleBill = { amount: 1_000_000, lastMonth, paidCycle: null };
    let cycle: PayCycle = october;
    const taken: number[] = [];
    for (let month = 0; month < 14; month += 1) {
      taken.push(billThisCycle(instalment, cycle));
      cycle = payCycleOn(cycle.payday, payday25);
    }
    expect(taken).toEqual([...Array<number>(12).fill(1_000_000), 0, 0]);
  });

  it('counts this cycle among the months left only while it is unpaid', () => {
    expect(lastMonthAfter(october, 12, false)).toBe(addMonthsTo('2026-10', 11));
    expect(lastMonthAfter(october, 12, true)).toBe(addMonthsTo('2026-10', 12));
    expect(monthsLeftOf(lastMonthAfter(october, 7, false), october, false)).toBe(7);
    expect(monthsLeftOf(lastMonthAfter(october, 7, true), october, true)).toBe(7);
  });

  it('keeps a bill with no end, and one from before bills could end', () => {
    const rent = { amount: 5_000_000, paidCycle: null };
    expect(billThisCycle(rent, payCycleOn('2031-01-10', payday25))).toBe(5_000_000);
  });
});

describe('paying a bill is not spending', () => {
  const statementDay = billPaidBy({ amount: 2_000_000, kind: 'card' }, 8_000_000, october);

  it('a 2tr card bill and an 8tr statement: the bill is paid and free money does not move', () => {
    const card: CycleBill = { amount: 2_000_000, kind: 'card', paidCycle: null };
    const before = freeWith([card], []);
    // Caught by email, it counts until the close asks (nothing waiting flatters the day).
    expect(freeWith([card], [caught(8_000_000)])).toBe(before - 8_000_000);
    const paid = { ...card, ...statementDay };
    expect(paid.paidCycle).toBe(october.start);
    expect(freeWith([paid], [caught(8_000_000, 'card')])).toBe(before);
  });

  it('a 5tr card payment of 5tr: the daily number does not drop', () => {
    const card: CycleBill = { amount: 5_000_000, kind: 'card', paidCycle: null };
    const paid = { ...card, ...billPaidBy(card, 5_000_000, october) };
    expect(freeWith([paid], [caught(5_000_000, 'card')])).toBe(freeWith([card], []));
  });

  it('an other bill of 5tr paid 6tr: free money drops by 1tr, once', () => {
    const power: CycleBill = { amount: 5_000_000, kind: 'other', paidCycle: null };
    const before = freeWith([power], []);
    const paid = { ...power, ...billPaidBy(power, 6_000_000, october) };
    expect(paid.paidAmount).toBe(6_000_000);
    expect(freeWith([paid], [caught(6_000_000, 'power')])).toBe(before - 1_000_000);
    // Next cycle the bill is its own amount again.
    const november = payCycleOn(october.payday, payday25);
    expect(billThisCycle(paid, november)).toBe(5_000_000);
  });

  it('an other bill paid its own amount keeps no paid amount', () => {
    expect(billPaidBy({ amount: 5_000_000 }, 5_000_000, october).paidAmount).toBeNull();
  });

  it('a payment taken back puts the bill back at its amount, still due', () => {
    const power: CycleBill = { amount: 5_000_000, paidCycle: null };
    const paid = { ...power, ...billPaidBy(power, 6_000_000, october) };
    const undone = { ...paid, ...billUnpaid() };
    expect(billThisCycle(undone, october)).toBe(5_000_000);
    expect(undone.paidCycle).toBeNull();
  });
});
