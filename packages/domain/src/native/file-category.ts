import { categoryHintOf, foldWords } from '../capture/spoken-spend';
import { merchantKeyOf } from '../capture/merchant-rule';
import type { SurfaceContext } from '../contracts/surfaces';
import { formatShort, formatVnd, type Vnd } from '../money/format';
import { likelyCategoriesAt } from '../spend/predict-category';

export type SurfaceCategory = SurfaceContext['categories'][number];

/**
 * The category an extension files a capture under, from what the app last wrote for it: the
 * merchant's rule first, then one of the user's categories named in the words ("Cà phê"), then
 * the starter category the words point to, then the hour's likely category, as Quick add does.
 */
export function fileCategory(
  context: SurfaceContext | null,
  merchant: string,
  words: string,
  at: Date,
): SurfaceCategory | null {
  const categories = context?.categories ?? [];
  if (categories.length === 0) return null;
  const byId = (id: string | null | undefined) => categories.find((c) => c.id === id) ?? null;

  const key = merchantKeyOf(merchant);
  const rule = key === '' ? undefined : context?.rules.find((r) => r.key === key);
  const ruled = byId(rule?.categoryId);
  if (ruled) return ruled;

  const folded = foldWords(words);
  const named = [...categories]
    .sort((a, b) => b.name.length - a.name.length)
    .find((c) => foldWords(c.name).trim() !== '' && folded.includes(foldWords(c.name)));
  if (named) return named;

  const hinted = byId(categoryHintOf(words));
  if (hinted) return hinted;

  const likely = likelyCategoriesAt(at.getHours()).map((name) => name.toLowerCase());
  for (const id of likely) {
    const found = byId(id);
    if (found) return found;
  }
  return categories[0] ?? null;
}

/**
 * What is safe to spend today once this amount is out, for a category that counts toward the
 * daily number: the app's `safeAfter` line ("Safe today is now {amount}") filled in, or the short
 * amount alone when the app wrote no line. Null for a category that does not count daily.
 */
export function safeAfterText(
  context: SurfaceContext | null,
  category: SurfaceCategory | null,
  amount: Vnd | null,
): string | null {
  if (!context || !category?.countsDaily || amount === null) return null;
  const left = formatShort(context.safeToday - amount);
  const line = context.strings['safeAfter'];
  return line?.includes('{amount}') ? line.replace('{amount}', left) : left;
}

/** An amount as the card and the snippet print it: "45.000₫", or empty when unread. */
export const amountText = (amount: Vnd | null): string =>
  amount === null ? '' : formatVnd(amount);

const pad = (n: number) => String(n).padStart(2, '0');
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * When, as the share card prints it on the phone's clock: "Today · 16:40" with the app's words
 * for today and yesterday, else "09/10 · 16:40".
 */
export function whenText(context: SurfaceContext | null, at: Date, now: Date): string {
  const clock = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12);
  const word = sameDay(at, now)
    ? context?.strings['today']
    : sameDay(at, yesterday)
      ? context?.strings['yesterday']
      : undefined;
  return `${word ?? `${pad(at.getDate())}/${pad(at.getMonth() + 1)}`} · ${clock}`;
}
