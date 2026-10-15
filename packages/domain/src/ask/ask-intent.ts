import { z } from 'zod';

import { designAmount, VND, type Currency } from '../money/currency';
import { parseAmount } from '../money/parse-amount';

/**
 * What a question to Ask 6pm is about. The server's model reads a question into one of these (it
 * never sees the user's money); offline, `readIntent` reads it with rules. Every number in the
 * answer is then worked out on the phone.
 */
export const askIntentSchema = z.discriminatedUnion('kind', [
  /** "Can I afford 2tr on Saturday?" */
  z.object({ kind: z.literal('afford'), amount: z.number().int().positive() }),
  /** "How much can I spend this weekend?" */
  z.object({ kind: z.literal('weekend') }),
  /** "What if I saved 500k more?" */
  z.object({ kind: z.literal('saveMore'), amount: z.number().int().positive() }),
  /** "When will the Tết pot be full?" — the pot's name as the user wrote it, if any. */
  z.object({ kind: z.literal('potFull'), pot: z.string().max(80).optional() }),
  /** "How much can I spend today?" */
  z.object({ kind: z.literal('today') }),
  z.object({ kind: z.literal('unknown') }),
]);
export type AskIntent = z.infer<typeof askIntentSchema>;

const WEEKEND = /weekend|cuối tuần|cuoi tuan|saturday and sunday|thứ bảy và chủ nhật/;
const SAVE = /\bsave|saving|future you|tiết kiệm|tiet kiem|để dành|de danh/;
const POT = /\bpot\b|hũ|hu\b|quỹ|quy\b|full|covered|đầy|day du|đủ/;
const TODAY = /today|hôm nay|hom nay/;

/**
 * Reads a question with rules alone, in English or Vietnamese: the offline fallback and the
 * shortcut for questions plain enough not to need the server.
 */
export function readIntent(
  question: string,
  potNames: readonly string[] = [],
  currency: Currency = VND,
): AskIntent {
  const q = question.toLowerCase().normalize('NFC');
  const pot = potNames.find((name) => name.length > 0 && q.includes(name.toLowerCase()));
  if (pot !== undefined || (POT.test(q) && !/\d/.test(q))) {
    return pot === undefined ? { kind: 'potFull' } : { kind: 'potFull', pot };
  }
  if (WEEKEND.test(q)) return { kind: 'weekend' };
  const amount = parseAmount(q, currency);
  // "What if I saved more?" with no amount asks about the design's example step, 500k.
  if (SAVE.test(q)) return { kind: 'saveMore', amount: amount ?? designAmount(500_000, currency) };
  if (amount) return { kind: 'afford', amount };
  if (TODAY.test(q)) return { kind: 'today' };
  return { kind: 'unknown' };
}
