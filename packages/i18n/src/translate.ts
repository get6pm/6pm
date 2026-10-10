import type { Catalogue, Language, ParamsArgument, StringKey } from './catalogue-types';
import { en } from './en';
import { vi } from './vi';

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

/**
 * The interface string for a key, in a language. `{name}` placeholders are filled from `params`;
 * a plural string picks its form from `params.count`.
 */
export function t<Key extends StringKey>(
  language: Language,
  key: Key,
  ...[params]: ParamsArgument<Key>
): string {
  const values: Readonly<Record<string, string | number>> = params ?? {};
  const entry = catalogues[language][key];
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
