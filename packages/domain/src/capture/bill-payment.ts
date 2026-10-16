import type { Money as Vnd } from '../money/currency';
import { billCountsIn, type BillKind } from '../plan/bills';
import type { PayCycle } from '../plan/pay-cycle';
import { billDueIn } from '../plan/plan-river';
import { diffDays, type LocalDate } from '../time/local-date';
import { foldWords } from './spoken-spend';

/**
 * What a spend that paid off a card or loan with no bill of its own carries in place of a bill
 * id (a card paid in full each month): kept out of the daily number, no bill touched.
 */
export const REPAYMENT = 'repayment';

/** How far from a bill's due day a payment can be and still look like it: a week either side. */
export const BILL_PAYMENT_DAYS = 7;

/**
 * Words that name a repayment in a bank's payee or a note, accents folded (`foldWords`): paying a
 * card, an instalment, a debt or a loan.
 */
const REPAYMENT_WORDS = [
  'thanh toan the',
  'thanh toan the tin dung',
  'tra gop',
  'tra no',
  'khoan vay',
  'tra khoan vay',
  'credit card payment',
  'card payment',
  'loan payment',
  'loan repayment',
  'instalment',
  'installment',
].map((word) => ` ${word} `);

/** Words in a bill's own name that make it a repayment: a card, trả góp, a loan, a debt. */
const REPAYMENT_NAME_WORDS = [
  'the tin dung',
  'credit card',
  'card',
  'tra gop',
  'instalment',
  'installment',
  'loan',
  'vay',
  'no',
  'owe',
  'debt',
].map((word) => ` ${word} `);

export interface PayableBill {
  readonly id: string;
  readonly name: string;
  readonly amount: Vnd;
  readonly dueDay: number;
  readonly kind?: BillKind;
  readonly lastMonth?: string | null;
  readonly paidCycle: string | null;
  /** The pay cycle the close last asked about it in: it asks at most once a cycle. */
  readonly askedCycle?: string | null;
}

export interface PaymentCapture {
  readonly id: string;
  readonly day: LocalDate;
  readonly amount: Vnd;
  readonly merchant: string;
  readonly note: string | null;
  /** The bill (or `REPAYMENT`) it is already marked as paying. */
  readonly paysBill?: string | null | undefined;
}

/** "Is this your {bill}?" about a spend, or, with no bill, "Paying off a card or loan?". */
export interface BillAsk {
  readonly spendId: string;
  readonly billId: string | null;
}

/** Whether a payee or note says it paid off a card, an instalment, a debt or a loan. */
export function namesRepayment(text: string): boolean {
  const folded = foldWords(text);
  return REPAYMENT_WORDS.some((word) => folded.includes(word));
}

function textOf(spend: PaymentCapture): string {
  return `${spend.merchant} ${spend.note ?? ''}`;
}

/** The bill's own name inside the payee or note, as whole words. */
function namesBill(text: string, bill: PayableBill): boolean {
  const name = foldWords(bill.name);
  return name.trim().length >= 2 && foldWords(text).includes(name);
}

/**
 * A bill a repayment word can point to: a card, one with a last month (trả góp), or one whose
 * name says it pays something off.
 */
function isRepayment(bill: PayableBill): boolean {
  if (bill.kind === 'card' || bill.lastMonth != null) return true;
  const name = foldWords(bill.name);
  return REPAYMENT_NAME_WORDS.some((word) => name.includes(word));
}

/**
 * How strongly a spend looks like a bill's payment, or null when it does not: the bill is unpaid
 * this cycle and not yet asked about, the spend is in this cycle within a week of the bill's due
 * day, and its amount is the bill's exactly (strongest), or the payee or note names the bill, or
 * names a repayment when the bill is one. Closer to the due day breaks a tie.
 */
function matchScore(spend: PaymentCapture, bill: PayableBill, cycle: PayCycle): number | null {
  if (bill.paidCycle === cycle.start || bill.askedCycle === cycle.start) return null;
  if (!billCountsIn(bill, cycle)) return null;
  if (spend.day < cycle.start || spend.day > cycle.payday) return null;
  const away = Math.abs(diffDays(spend.day, billDueIn(cycle, bill.dueDay)));
  if (away > BILL_PAYMENT_DAYS) return null;
  const text = textOf(spend);
  const exact = bill.amount > 0 && spend.amount === bill.amount;
  const named = namesBill(text, bill);
  if (!exact && !named && !(isRepayment(bill) && namesRepayment(text))) return null;
  return (exact ? 200 : 0) + (named ? 100 : 0) + (BILL_PAYMENT_DAYS - away);
}

/**
 * What the close asks about tonight's spends: each spend that looks like an unpaid bill's
 * payment is asked "Is this your {bill}?", each bill at most once (the best-matching spend wins);
 * a spend whose payee or note names a repayment with no bill left to match asks "Paying off a
 * card or loan?". In the order the spends were given; a spend is asked one thing at most.
 */
export function billPaymentAsks(
  spends: readonly PaymentCapture[],
  bills: readonly PayableBill[],
  cycle: PayCycle,
): BillAsk[] {
  const open = spends.filter((s) => s.paysBill == null && s.amount > 0);
  const pairs: { spendId: string; billId: string; score: number }[] = [];
  for (const spend of open) {
    for (const bill of bills) {
      const score = matchScore(spend, bill, cycle);
      if (score !== null) pairs.push({ spendId: spend.id, billId: bill.id, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const bySpend = new Map<string, string>();
  const taken = new Set<string>();
  for (const pair of pairs) {
    if (bySpend.has(pair.spendId) || taken.has(pair.billId)) continue;
    bySpend.set(pair.spendId, pair.billId);
    taken.add(pair.billId);
  }
  return open.flatMap((spend): BillAsk[] => {
    const billId = bySpend.get(spend.id);
    if (billId !== undefined) return [{ spendId: spend.id, billId }];
    return namesRepayment(textOf(spend)) ? [{ spendId: spend.id, billId: null }] : [];
  });
}
