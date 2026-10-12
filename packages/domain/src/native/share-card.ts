import { z } from 'zod';

import { parseBankReceipt, receiptReadingOrder, type ReceiptLine } from '../capture/bank-receipt';
import { numbersFree } from '../capture/inbox';
import {
  SURFACES_VERSION,
  type InboxSpend,
  type ShareCard,
  type SurfaceContext,
} from '../contracts/surfaces';
import { parseAmount } from '../money/parse-amount';
import { amountText, fileCategory, safeAfterText, whenText } from './file-category';

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
});
export type ShareEdits = z.infer<typeof shareEditsSchema>;

export function toReceiptLines(lines: z.infer<typeof receiptLinesSchema>): ReceiptLine[] {
  return lines.map(({ text, box, confidence }) => ({
    text,
    ...(box ? { box } : {}),
    ...(confidence !== undefined ? { confidence } : {}),
  }));
}

/**
 * The card for a shared receipt. Nothing readable still gives a card, with no amount, so the
 * extension can ask for one rather than fail.
 */
export function buildShareCard(
  lines: readonly ReceiptLine[],
  context: SurfaceContext | null,
  now: Date,
): ShareCard {
  const receipt = parseBankReceipt(lines);
  const at = receipt?.at ? new Date(receipt.at) : now;
  const payee = receipt?.payee ?? '';
  const amount = receipt?.amount ?? null;
  const category = fileCategory(context, payee, payee, at);
  return {
    amount,
    payee,
    payeeSure: receipt?.payeeSure ?? false,
    at: at.toISOString(),
    code: receipt?.code ?? null,
    bank: receipt?.bank ?? null,
    categoryId: category?.id ?? null,
    amountText: amountText(amount),
    safeAfterText: safeAfterText(context, category, amount),
    categoryName: category?.name ?? null,
    whenText: whenText(context, at, now),
    namingLines: numbersFree(receiptReadingOrder(lines)),
  };
}

/**
 * The inbox item Confirm writes: the card with the user's edits, caught so the close shows it.
 * Null while there is no amount (Confirm stays off until one is typed). An edited amount is read
 * like a typed one ("45" is 45.000₫).
 */
export function buildShareItem(card: ShareCard, edits: ShareEdits, id: string): InboxSpend | null {
  const amount =
    edits.amountText !== undefined && edits.amountText.trim() !== ''
      ? parseAmount(edits.amountText)
      : card.amount;
  if (amount === null || amount <= 0) return null;
  const payee = (edits.payee ?? card.payee).trim();
  return {
    v: SURFACES_VERSION,
    id,
    kind: 'spend',
    source: 'shared',
    status: 'caught',
    at: card.at,
    amount,
    merchant: payee,
    categoryId: edits.categoryId ?? card.categoryId,
    receipt: {
      ...(card.bank ? { bank: card.bank } : {}),
      ...(card.code ? { code: card.code } : {}),
      namingLines: card.namingLines,
    },
  };
}
