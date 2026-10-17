import {
  readSpokenNumbers,
  spokenAmount,
  type Currency,
  type MoneyFormat,
  type SpokenSpend,
} from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import { symbolCodepoints, type SymbolName } from '../../ui/icons/symbols.generated';

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

/** Android before 13 has no recogniser that is held to the phone: it may send the audio away. */
const ANDROID_ON_DEVICE_API = 33;

/**
 * Whether the phone's own recogniser can hear the locale without a server. iOS answers for any
 * language it lists. On Android only a language pack already downloaded counts, from Android 13:
 * the list also holds languages heard online or still to download, and an older recogniser only
 * prefers to stay offline. On-device mode must never send audio off the phone.
 */
export function hearsOnPhone({
  os,
  apiLevel,
  onDevice,
  supported,
  locale,
}: {
  readonly os: 'ios' | 'android';
  readonly apiLevel: number;
  /** What the recogniser says about on-device recognition at all. */
  readonly onDevice: boolean;
  readonly supported: {
    readonly locales: readonly string[];
    readonly installedLocales: readonly string[];
  };
  readonly locale: string;
}): boolean {
  if (!onDevice) return false;
  if (os === 'ios') return offersLocale(supported.locales, locale);
  return apiLevel >= ANDROID_ON_DEVICE_API && offersLocale(supported.installedLocales, locale);
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

/** One thing read from what was said, with its icon. */
export interface VoiceChip {
  readonly icon: SymbolName;
  readonly label: string;
}

/**
 * The chips under the transcript: what it was (with its category's icon), how much, its category;
 * each only when heard.
 */
export function spokenChips(
  spend: SpokenSpend,
  category: { readonly name: string; readonly icon: string } | null,
  money: Pick<MoneyFormat, 'full'>,
): VoiceChip[] {
  const chips: VoiceChip[] = [];
  if (spend.name !== '') {
    const icon =
      category && category.icon in symbolCodepoints
        ? (category.icon as SymbolName)
        : 'receipt_long';
    chips.push({ icon, label: spend.name });
  }
  if (spend.amount !== null) chips.push({ icon: 'payments', label: money.full(spend.amount) });
  if (category) chips.push({ icon: 'category', label: category.name });
  return chips;
}
