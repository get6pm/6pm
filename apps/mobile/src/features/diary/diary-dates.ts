import { useMemo } from 'react';

import { addDays, type LocalDate } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';

const noon = (day: LocalDate) => new Date(`${day}T12:00:00`);
const capitalise = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/** The Diary's date labels in the current language ("WED 07 OCT", "5–9 OCT", "October"). */
export function useDiaryDates() {
  const { language } = useI18n();
  return useMemo(() => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
    const format = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, options);
    const weekdayShort = format({ weekday: 'short' });
    const weekdayLong = format({ weekday: 'long' });
    const twoDigit = format({ day: '2-digit' });
    const numeric = format({ day: 'numeric' });
    const monthShort = format({ month: 'short' });
    const monthLong = format({ month: 'long' });
    const dayMonth = format({ day: 'numeric', month: 'short' });
    const narrow = format({ weekday: 'narrow' });
    const clock = format({ hour: '2-digit', minute: '2-digit', hour12: false });
    const month = (key: string) => noon(`${key}-01`);
    return {
      /** "WED 07 OCT" */
      stamp: (day: LocalDate) =>
        `${weekdayShort.format(noon(day))} ${twoDigit.format(noon(day))} ${monthShort.format(noon(day))}`.toLocaleUpperCase(),
      /** "5–9 OCT", or "28 SEP – 2 OCT" across a month end ("5–9 Oct" when not shouted). */
      range: (from: LocalDate, to: LocalDate, shout = true) => {
        const text =
          from.slice(0, 7) === to.slice(0, 7)
            ? from === to
              ? `${numeric.format(noon(to))} ${monthShort.format(noon(to))}`
              : `${numeric.format(noon(from))}–${numeric.format(noon(to))} ${monthShort.format(noon(to))}`
            : `${dayMonth.format(noon(from))} – ${dayMonth.format(noon(to))}`;
        return shout ? text.toLocaleUpperCase() : text;
      },
      /** "October" */
      month: (key: string) => capitalise(monthLong.format(month(key))),
      /** "Oct", "Sept" */
      monthShort: (key: string) => capitalise(monthShort.format(month(key))),
      /** "1 Nov" */
      dayMonth: (day: LocalDate) => dayMonth.format(noon(day)),
      /** "Wednesday" */
      weekday: (day: LocalDate) => capitalise(weekdayLong.format(noon(day))),
      /** "MON" */
      weekdayShort: (day: LocalDate) => weekdayShort.format(noon(day)).toLocaleUpperCase(),
      /** Monday-first column letters: M T W T F S S. */
      letters: (monday: LocalDate) =>
        Array.from({ length: 7 }, (_, i) => narrow.format(noon(addDays(monday, i)))),
      /** "18:30" */
      clock: (iso: string) => clock.format(new Date(iso)),
    };
  }, [language]);
}
