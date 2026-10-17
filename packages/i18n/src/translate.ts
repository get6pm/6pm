import type {
  Catalogue,
  Entry,
  Language,
  ParamsArgument,
  Platform,
  StringKey,
  Variants,
} from './catalogue-types';
import { en } from './en';
import { enAndroid } from './en-android';
import { vi } from './vi';
import { viAndroid } from './vi-android';

export const catalogues: { readonly [L in Language]: Catalogue } = { en, vi };

const pluralRules = new Map<Language, Intl.PluralRules>();

/**
 * The plural category of a number. Uses `Intl.PluralRules`; on an engine that ships without it,
 * falls back to the two rules these languages need (English: one or other; Vietnamese: other).
 */
function pluralCategory(language: Language, count: number): Intl.LDMLPluralRule {
  if (typeof Intl === 'undefined' || typeof Intl.PluralRules !== 'function') {
    return language === 'en' && count === 1 ? 'one' : 'other';
  }
  let rules = pluralRules.get(language);
  if (!rules) {
    rules = new Intl.PluralRules(language);
    pluralRules.set(language, rules);
  }
  return rules.select(count);
}

/** Android's own wording for the keys it reads differently, in each language. */
export const androidVariants: { readonly [L in Language]: Variants } = {
  en: enAndroid,
  vi: viAndroid,
};

const variantsOf: { readonly [P in Platform]: { readonly [L in Language]: Variants } | null } = {
  ios: null,
  android: androidVariants,
};

/**
 * The interface string for a key, in a language, as the iPhone reads it. `{name}` placeholders
 * are filled from `params`; a plural string picks its form from `params.count`.
 */
export function t<Key extends StringKey>(
  language: Language,
  key: Key,
  ...[params]: ParamsArgument<Key>
): string {
  return render(language, catalogues[language][key], params);
}

/**
 * `t` for a platform: a key the platform words its own way reads that way, every other key as the
 * catalogue has it.
 */
export function translatorFor(platform: Platform): typeof t {
  const variants = variantsOf[platform];
  if (variants === null) return t;
  return (language, key, ...[params]) =>
    render(language, variants[language][key] ?? catalogues[language][key], params);
}

function render(
  language: Language,
  entry: Entry,
  params: Readonly<Record<string, string | number>> | undefined,
): string {
  const values: Readonly<Record<string, string | number>> = params ?? {};
  let text: string;
  if (typeof entry === 'string') {
    text = entry;
  } else {
    const count = values['count'];
    const category = typeof count === 'number' ? pluralCategory(language, count) : 'other';
    text = entry[category] ?? entry.other;
  }
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}
