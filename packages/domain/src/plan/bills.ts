import type { Money as Vnd } from '../money/currency';
import { cycleMonth, type PayCycle } from './pay-cycle';
import { addMonthsTo } from './plan-river';

/**
 * What a bill is. A `card` bill is what someone plans to pay each month off a card balance they
 * already had: spending on the card counts the day it happens, so paying the card never moves
 * free money. Everything else (rent, trả góp, a loan, money owed to a person) is `other`.
 */
export type BillKind = 'card' | 'other';

/** The fields of a bill the month's maths reads. Storage rows carry more. */
export interface CycleBill {
  readonly amount: Vnd;
  readonly kind?: BillKind;
  /** The last month ('YYYY-MM') it is paid in; it stops by itself after. Null: no end. */
  readonly lastMonth?: string | null;
  /** The pay cycle (its start day) it was marked paid in. */
  readonly paidCycle: string | null;
  /** What paying an `other` bill actually took in `paidCycle`, when it was not its amount. */
  readonly paidAmount?: Vnd | null;
}

/**
 * Whether a bill still comes off in a pay cycle: always, or until the cycle named after its last
 * month (`cycleMonth`). A 12-month trả góp whose last month is September comes off in September's
 * cycle and never after.
 */
export function billCountsIn(bill: Pick<CycleBill, 'lastMonth'>, cycle: PayCycle): boolean {
  return bill.lastMonth == null || cycleMonth(cycle) <= bill.lastMonth;
}

/**
 * What a bill takes from a pay cycle: nothing once it has ended; what was actually paid when an
 * `other` bill was paid a different amount this cycle; otherwise its amount. A card bill always
 * takes its amount, whatever paid it off, since anything above it was card spending that already
 * counted the day it happened.
 */
export function billThisCycle(bill: CycleBill, cycle: PayCycle): Vnd {
  if (!billCountsIn(bill, cycle)) return 0;
  if (bill.kind !== 'card' && bill.paidCycle === cycle.start && bill.paidAmount != null) {
    return bill.paidAmount;
  }
  return bill.amount;
}

/** Σ what every bill takes from a pay cycle: the `bills` of the daily number. */
export function billsThisCycle(bills: readonly CycleBill[], cycle: PayCycle): Vnd {
  return bills.reduce((sum, bill) => sum + billThisCycle(bill, cycle), 0);
}

/**
 * A bill once a payment of `amount` is said to be it: paid this cycle, and for an `other` bill a
 * different amount becomes this cycle's bill (so free money moves by the difference, once). A
 * card bill keeps its amount.
 */
export function billPaidBy(
  bill: Pick<CycleBill, 'amount' | 'kind'>,
  amount: Vnd,
  cycle: PayCycle,
): { readonly paidCycle: string; readonly paidAmount: Vnd | null } {
  const differs = bill.kind !== 'card' && amount !== bill.amount;
  return { paidCycle: cycle.start, paidAmount: differs ? amount : null };
}

/** A bill no longer paid by anything this cycle: back to due, at its own amount. */
export function billUnpaid(): { readonly paidCycle: null; readonly paidAmount: null } {
  return { paidCycle: null, paidAmount: null };
}

/**
 * The last month of a bill with `monthsLeft` payments to go (trả góp): this cycle's month counts
 * as one of them unless this cycle's payment is already made.
 */
export function lastMonthAfter(
  cycle: PayCycle,
  monthsLeft: number,
  paidThisCycle: boolean,
): string {
  const left = Math.max(1, Math.round(monthsLeft));
  return addMonthsTo(cycleMonth(cycle), paidThisCycle ? left : left - 1);
}

/** Payments still to go, this cycle's included unless it is paid: what the editor shows. */
export function monthsLeftOf(lastMonth: string, cycle: PayCycle, paidThisCycle: boolean): number {
  const [ly = 0, lm = 0] = lastMonth.split('-').map(Number);
  const [cy = 0, cm = 0] = cycleMonth(cycle).split('-').map(Number);
  const months = (ly - cy) * 12 + (lm - cm);
  return Math.max(0, paidThisCycle ? months : months + 1);
}
