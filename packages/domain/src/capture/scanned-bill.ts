import type { Money as Vnd } from '../money/currency';
import { billCountsIn } from '../plan/bills';
import type { PayCycle } from '../plan/pay-cycle';
import { billDueIn } from '../plan/plan-river';
import { diffDays, type LocalDate } from '../time/local-date';
import { BILL_PAYMENT_DAYS, type PayableBill } from './bill-payment';
import { foldWords } from './spoken-spend';

/** The kinds of bill a paper bill can be told apart as: the onboarding deck's three asks. */
export type BillTopic = 'rent' | 'power' | 'phone';

/**
 * Words a paper bill prints, accents folded (`foldWords`): the electricity or water company, the
 * phone or internet provider, the landlord's "tiền nhà". Phrases, so "điện" alone (also in "điện
 * thoại") names nothing.
 */
const PRINTED: Readonly<Record<BillTopic, readonly string[]>> = {
  power: [
    'tien dien',
    'dien luc',
    'evn',
    'evnhcmc',
    'evnhanoi',
    'dien nang',
    'tien nuoc',
    'cap nuoc',
    'nuoc sach',
    'sawaco',
    'electricity',
    'water bill',
  ],
  phone: [
    'cuoc vien thong',
    'cuoc di dong',
    'thue bao',
    'tra sau',
    'internet',
    'cap quang',
    'fpt telecom',
    'vnpt',
    'viettel telecom',
    'mobifone',
    'vinaphone',
    'truyen hinh',
    'broadband',
    'mobile plan',
  ],
  rent: ['tien nha', 'tien phong', 'thue nha', 'thue phong', 'rent'],
};

/** Words in a bill's own name that say which kind it is, accents folded. */
const NAMED: Readonly<Record<BillTopic, readonly string[]>> = {
  power: ['dien', 'nuoc', 'power', 'water', 'electric', 'electricity', 'evn'],
  phone: ['dien thoai', 'mang', 'internet', 'wifi', 'net', 'phone', 'mobile', '4g', '5g', 'fpt'],
  rent: ['nha', 'phong', 'rent', 'house', 'flat', 'apartment'],
};

const has = (folded: string, words: readonly string[]) =>
  words.some((word) => folded.includes(` ${word} `));

/** Which kind of bill a receipt's text is, or null when it reads as no bill. */
export function billTopicOf(text: string): BillTopic | null {
  const folded = foldWords(text);
  for (const topic of ['power', 'phone', 'rent'] as const) {
    if (has(folded, PRINTED[topic])) return topic;
  }
  return null;
}

/** Which kind of bill a plan bill's name says it is; "Điện thoại" is a phone, not power. */
export function billTopicOfName(name: string): BillTopic | null {
  const folded = foldWords(name);
  if (has(folded, NAMED.phone)) return 'phone';
  if (has(folded, NAMED.power)) return 'power';
  if (has(folded, NAMED.rent)) return 'rent';
  return null;
}

/** A paper bill as Scan read it. */
export interface ScannedBill {
  /** The total in the home currency, null while unread. */
  readonly amount: Vnd | null;
  /** Every line of the receipt, and the payee, as one text. */
  readonly text: string;
  readonly day: LocalDate;
}

/**
 * The plan bill a scanned receipt pays, or null. Only a bill still to pay this cycle: its name in
 * the receipt, or the same kind of bill as the receipt reads as (a power bill for an EVN notice),
 * or, within a week of its due day, its exact amount. The name and the kind beat the amount, and
 * the bill due nearest breaks a tie.
 */
export function billScanned<B extends PayableBill>(
  scan: ScannedBill,
  bills: readonly B[],
  cycle: PayCycle,
): B | null {
  const folded = foldWords(scan.text);
  const topic = billTopicOf(scan.text);
  let best: { bill: B; score: number } | null = null;
  for (const bill of bills) {
    if (bill.paidCycle === cycle.start || !billCountsIn(bill, cycle)) continue;
    const away = Math.abs(diffDays(scan.day, billDueIn(cycle, bill.dueDay)));
    const name = foldWords(bill.name);
    const named = name.trim().length >= 2 && folded.includes(name);
    const sameKind = topic !== null && billTopicOfName(bill.name) === topic;
    const exact = bill.amount > 0 && scan.amount === bill.amount && away <= BILL_PAYMENT_DAYS;
    if (!named && !sameKind && !exact) continue;
    const score = (named ? 400 : 0) + (sameKind ? 200 : 0) + (exact ? 100 : 0) - away;
    if (best === null || score > best.score) best = { bill, score };
  }
  return best?.bill ?? null;
}
