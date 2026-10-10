import { useMemo } from 'react';

import { parts, type LocalDate } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';

function dateOf(day: LocalDate): Date {
  const { year, month, day: d } = parts(day);
  return new Date(Date.UTC(year, month - 1, d));
}

function monthDate(month: string): Date {
  const [y = 0, m = 1] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

/** Dates and months as the Plan tab writes them, in the interface language. */
export function usePlanFormat(today: LocalDate) {
  const { language } = useI18n();
  return useMemo(() => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
    const f = (o: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...o });
    const longMonth = f({ month: 'long' });
    const longMonthYear = f({ month: 'long', year: 'numeric' });
    const shortMonth = f({ month: 'short' });
    const shortMonthYear = f({ month: 'short', year: 'numeric' });
    const dayShortMonth = f({ day: 'numeric', month: 'short' });
    const dayLongMonth = f({ day: 'numeric', month: 'long' });
    const weekday = f({ weekday: 'short' });
    const thisYear = today.slice(0, 4);
    const sameYear = (month: string) => month.slice(0, 4) === thisYear;
    return {
      /** "October" */
      month: (day: LocalDate) => longMonth.format(dateOf(day)),
      /** "November", "January 2027" */
      monthLong: (month: string) =>
        (sameYear(month) ? longMonth : longMonthYear).format(monthDate(month)),
      /** "Dec", "Nov 2027" */
      monthShort: (month: string) =>
        (sameYear(month) ? shortMonth : shortMonthYear).format(monthDate(month)),
      /** "1 Oct" */
      dayMonth: (day: LocalDate) => dayShortMonth.format(dateOf(day)),
      /** "9 October" */
      dayLongMonth: (day: LocalDate) => dayLongMonth.format(dateOf(day)),
      /** "1", or "30 Sept" when the cycle began last month */
      dayFrom: (day: LocalDate, to: LocalDate) =>
        day.slice(0, 7) === to.slice(0, 7)
          ? String(parts(day).day)
          : dayShortMonth.format(dateOf(day)),
      /** "Fri 9" */
      weekdayDay: (day: LocalDate) => `${weekday.format(dateOf(day))} ${parts(day).day}`,
      dayNumber: (day: LocalDate) => String(parts(day).day),
    };
  }, [language, today]);
}

export type PlanFormat = ReturnType<typeof usePlanFormat>;
