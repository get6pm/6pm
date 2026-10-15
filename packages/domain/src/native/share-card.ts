import { z } from 'zod';

import { receiptReadingOrder, type ReceiptLine } from '../capture/bank-receipt';
import { numbersFree } from '../capture/inbox';
import { readReceipt, type ReadReceipt } from '../capture/read-receipt';
import {
  SURFACES_VERSION,
  type InboxSpend,
  type ShareCard,
  type SurfaceContext,
} from '../contracts/surfaces';
import { fileCategory, safeAfterText, whenText } from './file-category';
import { currencyOption, editTextOf, rateIn, shareAmount, toDecimal } from './share-amount';

/** Lines as the share extension hands them over: recognised text, a PDF's text or a text share. */
export const receiptLinesSchema = z.array(
  z.object({
    text: z.string(),
    box: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
    confidence: z.number().min(0).max(1).optional(),
  }),
);

/** What the user changed on the card before Confirm. Each field is optional. */
export const shareEditsSchema = z.object({
  amountText: z.string().optional(),
  payee: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  /** The currency picked in Edit, when it is not the one read. */
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
});
export type ShareEdits = z.infer<typeof shareEditsSchema>;

export function toReceiptLines(lines: z.infer<typeof receiptLinesSchema>): ReceiptLine[] {
  return lines.map(({ text, box, confidence }) => ({
    text,
    ...(box ? { box } : {}),
    ...(confidence !== undefined ? { confidence } : {}),
  }));
}

/** What a receipt from abroad is most likely in, offered when its currency is a guess. */
export const LIKELY_CURRENCIES: readonly string[] = [
  'IDR',
  'THB',
  'SGD',
  'MYR',
  'USD',
  'EUR',
  'JPY',
  'KRW',
  'CNY',
];

/** A shop receipt whose currency was not printed: whatever it says, it is a guess. */
function guessed(read: ReadReceipt | null): boolean {
  return read?.kind === 'shop' && !read.currencySure;
}

/**
 * Currencies the card offers: none when the receipt's own is certain; for a guess, the guess,
 * đồng, the trip's and the likely ones; else the one read, the trip's and đồng.
 */
function currenciesFor(read: ReadReceipt | null, context: SurfaceContext | null) {
  if (read?.kind === 'transfer' || (read?.currency === 'VND' && read.currencySure)) return [];
  const trip = context?.travel?.currency;
  const codes = guessed(read)
    ? [read?.currency, 'VND', trip, ...LIKELY_CURRENCIES]
    : [read?.currency, trip, 'VND'];
  const unique = [...new Set(codes.filter((code): code is string => typeof code === 'string'))];
  return unique.length > 1 ? unique.map((code) => currencyOption(context, code)) : [];
}

/** The card for what was read (null when nothing was), in the app's words and categories. */
export function cardOf(
  read: ReadReceipt | null,
  lines: readonly ReceiptLine[],
  context: SurfaceContext | null,
  now: Date,
): ShareCard {
  const at = read?.at ? new Date(read.at) : now;
  const payee = read?.payee ?? '';
  const currency = read ? read.currency : 'VND';
  const printed =
    read?.printed != null && currency !== null ? toDecimal(Number(read.printed), currency) : null;
  const foreignRead = currency !== null && currency !== 'VND' && printed !== null;
  const base: ShareCard = {
    amount: read?.amount ?? null,
    payee,
    payeeSure: read?.payeeSure ?? false,
    at: at.toISOString(),
    atRead: read?.at != null,
    code: read?.code ?? null,
    bank: read?.bank ?? null,
    categoryId: null,
    amountText: '',
    safeAfterText: null,
    categoryName: null,
    whenText: whenText(context, at, now),
    namingLines: numbersFree(receiptReadingOrder(lines)),
    kind: read?.kind ?? 'shop',
    currency,
    currencySure: read?.currencySure ?? false,
    currencyGuessed: guessed(read),
    totalSure: read?.totalSure ?? false,
    totalLine: read?.totalLine ?? null,
    printed: printed ?? read?.printed ?? null,
    foreign: foreignRead ? { currency, amount: printed, rate: rateIn(context, currency) } : null,
    inDongText: null,
    editText: '',
    decimalEntry: false,
    currencies: currenciesFor(read, context),
    needsCheck: read === null || (read.kind === 'shop' && !(read.totalSure && read.currencySure)),
  };
  const shown = shareAmount(base, {});
  const category = fileCategory(context, payee, payee, at);
  return {
    ...base,
    amount: shown.amount,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    amountText: shown.amountText,
    inDongText: shown.inDongText,
    decimalEntry: shown.decimalEntry,
    editText: editTextOf(
      shown.foreign?.amount ?? (shown.amount === null ? null : String(shown.amount)),
      currency ?? 'VND',
    ),
    safeAfterText: safeAfterText(context, category, shown.amount),
  };
}

/**
 * The card for a shared receipt. Nothing readable still gives a card, with no amount, so the
 * extension can ask for one rather than fail. For a receipt that prints no currency, where the
 * photo was taken (`located`) is the first guess, and the trip's currency in Travel mode the last
 * before đồng.
 */
export function buildShareCard(
  lines: readonly ReceiptLine[],
  context: SurfaceContext | null,
  now: Date,
  located: string | null = null,
): ShareCard {
  const read = readReceipt(lines, context?.travel?.currency ?? null, located);
  return cardOf(read, lines, context, now);
}

/**
 * The inbox item Confirm writes: the card with the user's edits, caught so the close shows it.
 * A currency the user picked on the card is no longer a guess.
 * Null while there is no amount (Confirm stays off until one is typed). An edited amount in đồng
 * is read like a typed one ("45" is 45.000₫). A foreign amount keeps its currency and the rate
 * it was priced at; with no rate yet its đồng is null and the app prices it when a rate arrives.
 */
export function buildShareItem(card: ShareCard, edits: ShareEdits, id: string): InboxSpend | null {
  const shown = shareAmount(card, edits);
  if (shown.amount === null && shown.foreign === null) return null;
  const payee = (edits.payee ?? card.payee).trim();
  const foreign = shown.foreign;
  return {
    v: SURFACES_VERSION,
    id,
    kind: 'spend',
    source: 'shared',
    status: 'caught',
    at: card.at,
    amount: shown.amount,
    merchant: payee,
    categoryId: edits.categoryId ?? card.categoryId,
    ...(card.currencyGuessed && edits.currency === undefined ? { currencyGuessed: true } : {}),
    receipt: {
      ...(card.bank ? { bank: card.bank } : {}),
      ...(card.code ? { code: card.code } : {}),
      namingLines: card.namingLines,
      payeeSure: card.payeeSure || edits.payee !== undefined,
    },
    ...(foreign
      ? {
          foreign: {
            currency: foreign.currency,
            amount: foreign.amount,
            ...(foreign.rate !== null && shown.amount !== null ? { rate: foreign.rate } : {}),
          },
        }
      : {}),
  };
}
