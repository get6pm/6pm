import { formatShort, yearSummary, type YearKey } from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import type { I18n } from '../../i18n/i18n';
import type { useDiaryDates } from '../diary/diary-dates';
import type { ZineView } from '../diary/zine/zine-view';
import type { YearBookDoc } from './year-book-html';

/**
 * Words and numbers for every page of a year's book, from each month's zine and the year's sums
 * (`@6pm/domain`). The month pages print exactly what the money diary sheet shows.
 */
export function yearBookDoc(input: {
  readonly year: YearKey;
  readonly zines: readonly ZineView[];
  readonly t: I18n['t'];
  readonly language: Language;
  readonly dates: ReturnType<typeof useDiaryDates>;
  readonly display: string;
  readonly fonts: string;
  readonly companion: string | null;
}): YearBookDoc {
  const { year, zines, t, language, dates } = input;
  const sum = yearSummary(
    year,
    zines.map((z) => z.diary),
    Object.fromEntries(zines.map((z) => [z.diary.month, z.futureYouAdded])),
  );
  const short = (amount: number) => formatShort(amount, language);
  const days = (count: number) => t('diary.zine.days', { count });
  return {
    language,
    display: input.display,
    fonts: input.fonts,
    companion: input.companion,
    cover: {
      kicker: t('yearBook.cover.kicker'),
      year,
      title: t('diary.year.title'),
      sub: t('yearBook.cover.sub', { count: zines.length }),
      closed: t('yearBook.cover.closed', { count: sum.closed }),
    },
    summary: {
      kicker: t('yearBook.summary.kicker', { year }),
      headline:
        sum.spare >= 0
          ? t('yearBook.summary.headline.spare', { year, amount: short(sum.spare) })
          : t('yearBook.summary.headline.over', { next: String(Number(year) + 1) }),
      closed: `${sum.closed}/${sum.days}`,
      stats: [
        {
          key: t('diary.zine.spent'),
          value: short(sum.spent),
          sub: t('diary.zine.spentSub', { plan: short(sum.plan) }),
        },
        {
          key: t('diary.zine.futureYou'),
          value: `+${short(sum.saved)}`,
          sub: t('yearBook.summary.futureYouSub'),
        },
        {
          key: t('diary.zine.under'),
          value: days(sum.under),
          sub: t('diary.zine.underSub', { closed: sum.closed }),
        },
        {
          key: t('diary.zine.run'),
          value: days(sum.run?.days ?? 0),
          sub: sum.run ? dates.range(sum.run.from, sum.run.to, false) : '',
        },
      ],
      contents: t('yearBook.summary.contents'),
      lines: sum.lines.map((l) => ({
        key: l.month,
        name: dates.month(l.month),
        sub: t('diary.zines.closed', { closed: l.closed, days: l.days }),
        amount:
          l.spare >= 0
            ? t('diary.zines.spare', { amount: short(l.spare) })
            : t('diary.zines.over', { amount: short(-l.spare) }),
      })),
    },
    months: zines.map((z) => ({ kicker: t('diary.zine.kicker', { no: z.no }), zine: z })),
    labels: {
      stamp: t('diary.zine.stamp'),
      places: t('diary.zine.places'),
      every: t('diary.zine.every'),
      signoff: t('diary.zine.signoff'),
    },
  };
}
