import type { InboxSpend } from '../contracts/surfaces';
import type { SpendSource } from '../spend/spend';
import { BANKS } from '../vietqr/bank-catalogue';
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
 * The spend an inbox item becomes. The category is the extension's when it still exists, else
 * the merchant's rule, else the fallback. An amount the source could not read is saved as 0 and
 * caught, so the close asks for it rather than the capture being lost.
 */
export function inboxItemToNewSpend(item: InboxSpend, filing: InboxFiling): InboxSpendDraft {
  const named =
    item.categoryId !== null && filing.categoryIds.has(item.categoryId) ? item.categoryId : null;
  return {
    id: item.id,
    amount: item.amount ?? 0,
    categoryId: named ?? filing.ruleCategoryId ?? filing.fallbackCategoryId,
    merchant: item.merchant.trim(),
    source: item.source,
    status: item.amount === null ? 'caught' : item.status,
    note: item.note ?? null,
    detail: receiptDetail(item.receipt),
    at: new Date(item.at),
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
