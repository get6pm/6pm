import type { InboxSpend } from '../contracts/surfaces';
import type { SpendSource } from '../spend/spend';
import { rateNumber } from '../travel/fx';
import { BANKS } from '../vietqr/bank-catalogue';
import { addDays } from '../time/local-date';
import { RATE_PENDING, rateDayOf, readForeignNote } from './foreign-price';
import { merchantKeyOf } from './merchant-rule';

/** Wallet runs an automation twice for one tap, and again on a decline: one spend, not three. */
export const REPEAT_TAP_WINDOW_MS = 120_000;

/** A spend as the app saves it, made from something an extension left in the inbox. */
export interface InboxSpendDraft {
  /** The inbox item's id, kept as the spend's id so a second import finds it. */
  readonly id: string;
  readonly amount: number;
  readonly categoryId: string;
  readonly merchant: string;
  readonly source: InboxSpend['source'];
  readonly status: InboxSpend['status'];
  readonly note: string | null;
  readonly detail: string | null;
  readonly at: Date;
  /**
   * A spend in another currency: what Travel mode records beside the đồng, with the rate that
   * priced it, or `RATE_PENDING` while it waits for one.
   */
  readonly foreignAmount: { currency: string; amount: number; rate: number } | null;
  /** The receipt printed no currency and the one saved was guessed. */
  readonly currencyGuessed: boolean;
}

export interface InboxFiling {
  /** The category the merchant's rule files it under, when there is a rule. */
  readonly ruleCategoryId: string | null;
  /** The category to use when neither the extension nor a rule named one. */
  readonly fallbackCategoryId: string;
  /** Categories that exist now: an extension's context may be older than an archive. */
  readonly categoryIds: ReadonlySet<string>;
}

/** What a shared receipt says about where it came from, as the spend's detail line. */
export function receiptDetail(receipt: InboxSpend['receipt']): string | null {
  if (!receipt) return null;
  const parts = [receipt.bank, receipt.code].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * The bank a shared receipt came from, read back from the detail line `receiptDetail` wrote:
 * the part before the code, or the whole line when it is a bank the catalogue knows.
 */
export function receiptBankOf(detail: string | null): string | null {
  if (!detail) return null;
  const [first = '', code] = detail.split(' · ');
  if (code !== undefined) return first || null;
  return BANKS.some((bank) => bank.shortName === first) ? first : null;
}

/**
 * The foreign amount a capture keeps beside its đồng: priced at its rate, or with no rate yet a
 * pending one (`RATE_PENDING`), never dropped, so it is priced later instead of staying 0₫.
 */
function foreignAmountOf(item: InboxSpend): InboxSpendDraft['foreignAmount'] {
  const foreign = item.foreign;
  if (!foreign) return null;
  const priced = foreign.rate !== undefined && item.amount !== null;
  return {
    currency: foreign.currency,
    amount: Number(foreign.amount),
    rate: priced && foreign.rate ? rateNumber(foreign.rate) : RATE_PENDING,
  };
}

/**
 * Days a shared receipt can be older than today and still keep the rate its card priced it at
 * (the newest the phone had). An older one is priced again at the rate of its own day.
 */
export const RECEIPT_RATE_SLACK_DAYS = 2;

/** A receipt shared long after it was paid: the card's rate is not that day's. */
function pricedLate(item: InboxSpend, now: Date): boolean {
  if (item.source !== 'shared') return false;
  const paid = new Date(item.at);
  if (Number.isNaN(paid.getTime())) return false;
  return rateDayOf(paid) < addDays(rateDayOf(now), -RECEIPT_RATE_SLACK_DAYS);
}

/** The note, unless it only repeats the foreign amount kept beside it ("Rp496.650"). */
function noteOf(item: InboxSpend): string | null {
  const note = item.note ?? null;
  const noted = readForeignNote(note);
  const foreign = item.foreign;
  const repeats =
    noted !== null &&
    foreign !== undefined &&
    noted.currency === foreign.currency &&
    noted.amount === Number(foreign.amount);
  return repeats ? null : note;
}

/**
 * The spend an inbox item becomes. The category is the extension's when it still exists, else
 * the merchant's rule, else the fallback. An amount the source could not read is saved as 0 and
 * caught, so the close asks for it rather than the capture being lost; a foreign one keeps its
 * amount with the rate pending, to be priced when a rate arrives. So does a foreign receipt shared
 * days after it was paid: it is priced again at the rate of its own day.
 */
export function inboxItemToNewSpend(
  item: InboxSpend,
  filing: InboxFiling,
  now: Date = new Date(),
): InboxSpendDraft {
  const named =
    item.categoryId !== null && filing.categoryIds.has(item.categoryId) ? item.categoryId : null;
  const kept = foreignAmountOf(item);
  const reprice = kept !== null && kept.rate > 0 && pricedLate(item, now);
  const amount = reprice ? null : item.amount;
  return {
    id: item.id,
    amount: amount ?? 0,
    categoryId: named ?? filing.ruleCategoryId ?? filing.fallbackCategoryId,
    merchant: item.merchant.trim(),
    source: item.source,
    status: amount === null ? 'caught' : item.status,
    note: noteOf(item),
    detail: receiptDetail(item.receipt),
    at: new Date(item.at),
    foreignAmount: reprice ? { ...kept, rate: RATE_PENDING } : kept,
    currencyGuessed: item.currencyGuessed === true,
  };
}

/** The parts of a spend that tell whether a capture repeats it. */
export interface CapturedSpend {
  readonly source: SpendSource;
  readonly merchant: string;
  readonly amount: number;
  /** ISO 8601. */
  readonly at: string;
  readonly detail?: string | null;
}

/** The same tap reported again: same source, merchant and amount within two minutes. */
export function isRepeatTap(incoming: InboxSpend, existing: CapturedSpend): boolean {
  if (incoming.source !== 'applePay' || existing.source !== 'applePay') return false;
  if ((incoming.amount ?? 0) !== existing.amount) return false;
  if (merchantKeyOf(incoming.merchant) !== merchantKeyOf(existing.merchant)) return false;
  const gap = Math.abs(Date.parse(incoming.at) - Date.parse(existing.at));
  return !Number.isNaN(gap) && gap <= REPEAT_TAP_WINDOW_MS;
}

/** A receipt shared a second time: a shared spend from the same bank with the same code. */
export function isSameReceipt(incoming: InboxSpend, existing: CapturedSpend): boolean {
  if (incoming.source !== 'shared' || existing.source !== 'shared') return false;
  if (!incoming.receipt?.code) return false;
  return receiptDetail(incoming.receipt) === (existing.detail ?? null);
}

/**
 * A receipt's lines with every number taken out, the only part that may leave the phone to name
 * the payee: any word holding a digit (amounts, accounts, codes, dates, times) is dropped, and a
 * line left with nothing but punctuation goes too.
 */
export function numbersFree(lines: readonly string[]): string[] {
  return lines
    .map((line) =>
      line
        .split(/\s+/)
        .filter((word) => word !== '' && !/\d/.test(word))
        .join(' '),
    )
    .filter((line) => /[\p{L}]/u.test(line));
}
