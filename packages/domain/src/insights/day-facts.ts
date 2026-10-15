import { needsReview, sumCounted } from '../spend/spend';
import { daysInMonth, diffDays, makeDate, parts } from '../time/local-date';
import { countSlot, moneySlot, type Fact, type InsightBill, type InsightInput } from './fact';

/** Bills are worth a word this many days before they fall due. */
const BILL_NOTICE_DAYS = 3;
/** Payday is worth a word this many days ahead. */
const PAYDAY_NOTICE_DAYS = 3;

/** How today stands against its line: over, under with some spent, or nothing spent yet. */
export function todayFacts(input: InsightInput): Fact[] {
  const { day, today } = input;
  if (day.safe < 0) {
    return [
      {
        kind: 'todayOver',
        key: `todayOver:${today}`,
        tone: 'watch',
        salience: 0.8,
        repeatAfterDays: 1,
        slots: { over: moneySlot(-day.safe), tomorrow: moneySlot(day.tomorrow) },
      },
    ];
  }
  if (day.spent > 0) {
    return [
      {
        kind: 'todayUnder',
        key: `todayUnder:${today}`,
        tone: 'good',
        salience: 0.35,
        repeatAfterDays: 1,
        slots: { safe: moneySlot(day.safe), spent: moneySlot(day.spent) },
      },
    ];
  }
  if (day.line <= 0) return [];
  return [
    {
      kind: 'noSpendYet',
      key: `noSpendYet:${today}`,
      tone: 'good',
      salience: 0.25,
      repeatAfterDays: 1,
      slots: { line: moneySlot(day.line) },
    },
  ];
}

/** What the close will walk through tonight, earlier waiting days included. */
export function waitingFacts(input: InsightInput): Fact[] {
  const waiting = input.spends.filter((s) => s.day <= input.today && needsReview(s));
  if (waiting.length === 0) return [];
  return [
    {
      kind: 'waitingTonight',
      key: `waitingTonight:${input.today}:${waiting.length}`,
      tone: 'neutral',
      salience: 0.55,
      repeatAfterDays: 1,
      slots: {
        count: countSlot(waiting.length),
        amount: moneySlot(sumCounted(waiting, input.notDaily)),
      },
    },
  ];
}

export function paydayFacts(input: InsightInput): Fact[] {
  const { daysLeft, payday } = input.cycle;
  if (daysLeft < 1 || daysLeft > PAYDAY_NOTICE_DAYS) return [];
  return [
    {
      kind: 'paydaySoon',
      key: `paydaySoon:${payday}`,
      tone: 'good',
      salience: 0.5,
      repeatAfterDays: PAYDAY_NOTICE_DAYS + 1,
      slots: { days: countSlot(daysLeft), payday: { type: 'date', value: payday } },
    },
  ];
}

/** The next date a bill falls due on or after `today`, its day clamped to short months. */
export function nextDueDate(bill: Pick<InsightBill, 'dueDay'>, today: string): string {
  const { year, month } = parts(today);
  const inMonth = (y: number, m: number) =>
    makeDate(y, m, Math.min(bill.dueDay, daysInMonth(y, m)));
  const thisMonth = inMonth(year, month);
  if (thisMonth >= today) return thisMonth;
  return month === 12 ? inMonth(year + 1, 1) : inMonth(year, month + 1);
}

/** Unpaid bills falling due soon, the nearest first. */
export function billFacts(input: InsightInput): Fact[] {
  return input.bills
    .filter((bill) => !bill.paid && bill.amount > 0)
    .map((bill) => ({ bill, due: nextDueDate(bill, input.today) }))
    .filter(({ due }) => diffDays(due, input.today) <= BILL_NOTICE_DAYS)
    .sort((a, b) => a.due.localeCompare(b.due))
    .map(({ bill, due }): Fact => ({
      kind: 'billDue',
      key: `billDue:${bill.id}:${due}`,
      tone: 'neutral',
      // Due today matters most.
      salience: 0.6 + (BILL_NOTICE_DAYS - diffDays(due, input.today)) * 0.05,
      repeatAfterDays: 1,
      slots: {
        bill: { type: 'bill', id: bill.id, name: bill.name },
        amount: moneySlot(bill.amount),
        days: countSlot(diffDays(due, input.today)),
      },
    }));
}

/** Work spends this cycle still waiting to be claimed back. */
export function workFacts(input: InsightInput): Fact[] {
  const work = input.spends.filter(
    (s) =>
      s.forWork === true &&
      s.day >= input.cycle.start &&
      s.status !== 'skipped' &&
      s.status !== 'deleted',
  );
  if (work.length === 0) return [];
  const amount = work.reduce((sum, s) => sum + s.amount, 0);
  return [
    {
      kind: 'workToClaim',
      key: `workToClaim:${work.length}`,
      tone: 'neutral',
      salience: 0.3,
      repeatAfterDays: 7,
      slots: { count: countSlot(work.length), amount: moneySlot(amount) },
    },
  ];
}
