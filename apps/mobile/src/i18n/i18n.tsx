import { getLocales } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useMemo, useState, type ReactNode } from 'react';

import {
  isLanguage,
  pickLanguage,
  t,
  type Language,
  type ParamsArgument,
  type StringKey,
} from '@6pm/i18n';

export interface I18n {
  readonly language: Language;
  /** The language kept in Settings, or null while the app follows the phone. */
  readonly chosen: Language | null;
  /** The interface string for a key, in the current language. */
  readonly t: <Key extends StringKey>(key: Key, ...params: ParamsArgument<Key>) => string;
  /** "Friday", "Thứ Sáu". */
  readonly weekday: (date: Date) => string;
  /** "Wed 2 Sept", "Thứ 4, 2 thg 9": a day outside this week. */
  readonly weekdayDate: (date: Date) => string;
  /** "9 October", "9 tháng 10". */
  readonly dayMonth: (date: Date) => string;
  /** Keeps a language for the app, or follows the phone again with null. */
  readonly setLanguage: (language: Language | null) => void;
}

const KEY = 'language';

const I18nContext = createContext<I18n | null>(null);

function make(language: Language, chosen: Language | null, setLanguage: I18n['setLanguage']): I18n {
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
  const weekdayDate = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return {
    language,
    chosen,
    t: (key, ...params) => t(language, key, ...params),
    weekday: (date) => weekday.format(date),
    weekdayDate: (date) => weekdayDate.format(date),
    dayMonth: (date) => dayMonth.format(date),
    setLanguage,
  };
}

/**
 * The interface language: the one kept in Settings when there is one, else the phone's own. It is
 * read synchronously at launch so the first frame is already in the right language.
 */
export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const [stored, setStored] = useState(
    () =>
      db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [KEY])
        ?.value ?? null,
  );
  const language = pickLanguage(
    getLocales().map((l) => l.languageTag),
    stored,
  );
  const chosen = isLanguage(stored) ? stored : null;
  const value = useMemo(
    () =>
      make(language, chosen, (next) => {
        setStored(next);
        if (next === null) db.runSync('DELETE FROM settings WHERE key = ?', [KEY]);
        else db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [KEY, next]);
      }),
    [db, language, chosen],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18n {
  const value = use(I18nContext);
  if (!value) throw new Error('useI18n needs an I18nProvider above it');
  return value;
}
