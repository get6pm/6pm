import { getLocales } from 'expo-localization';
import { createContext, use, useMemo, type ReactNode } from 'react';

import { pickLanguage, t, type Language, type ParamsArgument, type StringKey } from '@6pm/i18n';

export interface I18n {
  readonly language: Language;
  /** The interface string for a key, in the current language. */
  readonly t: <Key extends StringKey>(key: Key, ...params: ParamsArgument<Key>) => string;
  /** "Friday", "Thứ Sáu". */
  readonly weekday: (date: Date) => string;
  /** "9 October", "9 tháng 10". */
  readonly dayMonth: (date: Date) => string;
}

const I18nContext = createContext<I18n | null>(null);

function make(language: Language): I18n {
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
  return {
    language,
    t: (key, ...params) => t(language, key, ...params),
    weekday: (date) => weekday.format(date),
    dayMonth: (date) => dayMonth.format(date),
  };
}

/** The interface language: the stored choice when there is one, else the phone's own. */
export function I18nProvider({
  stored,
  children,
}: {
  readonly stored?: string | null;
  readonly children: ReactNode;
}) {
  const language = pickLanguage(
    getLocales().map((l) => l.languageTag),
    stored ?? null,
  );
  const value = useMemo(() => make(language), [language]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18n {
  const value = use(I18nContext);
  if (!value) throw new Error('useI18n needs an I18nProvider above it');
  return value;
}
