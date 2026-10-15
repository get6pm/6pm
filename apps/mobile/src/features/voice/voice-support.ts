import {
  readSpokenNumbers,
  spokenAmount,
  type Currency,
  type MoneyFormat,
  type SpokenSpend,
} from '@6pm/domain';
import type { Language } from '@6pm/i18n';

/** The dictation language for the app language. */
export function speechLocale(language: Language): 'vi-VN' | 'en-US' {
  return language === 'vi' ? 'vi-VN' : 'en-US';
}

/** Whether the recogniser lists the locale ("vi-VN", "vi_VN" and "vi" all count for "vi-VN"). */
export function offersLocale(locales: readonly string[], locale: string): boolean {
  const want = locale.toLowerCase();
  const lang = want.split('-')[0];
  return locales.some((l) => {
    const id = l.replace('_', '-').toLowerCase();
    return id === want || id === lang;
  });
}

/** Words the recogniser should expect: the user's categories and the ways amounts are said. */
export function contextualStrings(categoryNames: readonly string[]): string[] {
  return [...new Set([...categoryNames, 'k', 'nghìn', 'triệu'])];
}

/**
 * The category a said spend goes to: one the user taught 6pm for that name wins, then the one
 * the words point to, when the user still has it. Null leaves the screen's own pick.
 */
export function spokenCategory(
  spend: SpokenSpend,
  learned: string | null,
  categoryIds: ReadonlySet<string>,
): string | null {
  if (learned) return learned;
  return spend.categoryHint && categoryIds.has(spend.categoryHint) ? spend.categoryHint : null;
}

/**
 * A said spend with its amount read in the home currency: the same number the words chose (the
 * last said with a unit, else the last said), in home minor units. Đồng is read as it was.
 */
export function spendIn(spend: SpokenSpend, text: string, currency: Currency): SpokenSpend {
  if (currency.code === 'VND' || spend.amount === null) return spend;
  const numbers = readSpokenNumbers(text.normalize('NFC').trim());
  const spoken = [...numbers].reverse().find((n) => n.scaled) ?? numbers[numbers.length - 1];
  return { ...spend, amount: spoken ? spokenAmount(spoken, currency) : null };
}

/** The chips under the transcript: what it was, how much, its category; each only when heard. */
export function spokenChips(
  spend: SpokenSpend,
  categoryName: string | null,
  money: Pick<MoneyFormat, 'full'>,
): string[] {
  const chips: string[] = [];
  if (spend.name !== '') chips.push(spend.name);
  if (spend.amount !== null) chips.push(money.full(spend.amount));
  if (categoryName) chips.push(categoryName);
  return chips;
}
