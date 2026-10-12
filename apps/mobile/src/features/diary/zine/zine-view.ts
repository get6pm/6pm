import {
  dayDot,
  formatShort,
  formatVnd,
  monthDiary,
  nextMonthStart,
  type ClosedDayRow,
  type ClosedDayTotal,
} from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import { toDiarySpend, type readMonthDiary } from '../../../data/diary-queries';
import type { MoneySnapshot } from '../../../data/money-store';
import type { I18n } from '../../../i18n/i18n';
import { isSymbolName } from '../../../ui/icons/symbol';
import { merchantIcon } from '../../today/merchant-icon';
import { coverTint, dots } from '../diary-colours';
import type { useDiaryDates } from '../diary-dates';
import type { ZineStat } from './zine-cover';
import type { ZineDay, ZinePlace, ZineTicket } from './zine-pages';

/** A month as the database gives it to the zine. */
export type MonthDiaryData = Awaited<ReturnType<typeof readMonthDiary>>;

/**
 * Everything a month's money diary prints, worded in the current language: the money diary sheet
 * and the year book both draw from it.
 */
export function zineView({
  month,
  data,
  categories,
  notDaily,
  t,
  language,
  dates,
  showAmounts,
}: {
  /** 'YYYY-MM' */
  readonly month: string;
  readonly data: MonthDiaryData;
  readonly categories: MoneySnapshot['categories'];
  readonly notDaily: ReadonlySet<string>;
  readonly t: I18n['t'];
  readonly language: Language;
  readonly dates: ReturnType<typeof useDiaryDates>;
  readonly showAmounts: boolean;
}) {
  const diary = monthDiary({
    month,
    closed: data.closed,
    spends: data.spends.map(toDiarySpend),
    notDaily,
  });
  const rowOf = (d: ClosedDayTotal): ClosedDayRow | undefined =>
    data.closed.find((r) => r.day === d.day);
  const closedText = `${diary.closed.length}/${diary.days}`;
  const monthName = dates.month(month);
  const nextName = dates.month(nextMonthStart(month).slice(0, 7));
  const days = (count: number) => t('diary.zine.days', { count });

  const headline =
    diary.spare >= 0
      ? t('diary.zine.headline.spare', {
          month: monthName,
          amount: formatShort(diary.spare, language),
        })
      : data.futureYou.added > 0
        ? t('diary.zine.headline.overPaid')
        : t('diary.zine.headline.over');

  const stats: ZineStat[] = [
    {
      key: t('diary.zine.spent'),
      value: formatShort(diary.spent, language),
      sub: t('diary.zine.spentSub', { plan: formatShort(diary.plan, language) }),
    },
    {
      key: t('diary.zine.futureYou'),
      value: `+${formatShort(data.futureYou.added, language)}`,
      sub: t('diary.zine.futureYouSub', { total: formatShort(data.futureYou.total, language) }),
    },
    {
      key: t('diary.zine.under'),
      value: days(diary.under),
      sub: t('diary.zine.underSub', { closed: diary.closed.length }),
    },
    {
      key: t('diary.zine.run'),
      value: days(diary.run?.days ?? 0),
      sub: diary.run ? dates.range(diary.run.from, diary.run.to, false) : '',
    },
  ];

  const top = diary.places[0]?.amount ?? 1;
  const places: ZinePlace[] = diary.places.map((p) => {
    const category = categories.find((c) => c.id === p.category);
    const icon = category && isSymbolName(category.icon) ? category.icon : 'payments';
    return {
      name: p.merchant,
      sub: t('diary.places.visits', { count: p.visits }),
      amount: formatShort(p.amount, language),
      icon: merchantIcon(p.merchant, icon),
      hue: category?.hue ?? 80,
      pct: Math.round((p.amount / Math.max(1, top)) * 100),
    };
  });

  const ticket = (label: string, d: ClosedDayTotal | null): ZineTicket | null =>
    d === null
      ? null
      : {
          label,
          date: dates.stamp(d.day),
          amount: formatVnd(d.spent),
          note: rowOf(d)?.note ?? null,
        };

  const everyDay: ZineDay[] = diary.closed.map((d) => ({
    key: d.day,
    dow: dates.weekdayShort(d.day),
    day: d.day.slice(8),
    total: formatShort(d.spent, language),
    dot: dayDot(d.spent, d.line) === 'under' ? dots.paperUnder : dots.paperOver,
  }));

  const tint = coverTint(month);
  return {
    diary,
    futureYouAdded: data.futureYou.added,
    no: String(data.no).padStart(2, '0'),
    tint,
    title: monthName,
    headline,
    closedText,
    stats,
    places,
    quiet: ticket(t('diary.zine.quiet'), diary.quietest),
    big: ticket(t('diary.zine.big'), diary.biggest),
    everyDay,
    note: t(diary.spare >= 0 ? 'diary.zine.note.spare' : 'diary.zine.note.over', {
      month: monthName.toLocaleLowerCase(),
      next: nextName.toLocaleLowerCase(),
    }),
    share: {
      month: dates.monthShort(month),
      dots: diary.dots,
      stat: showAmounts
        ? t('diary.zine.shareSpent', {
            spent: formatShort(diary.spent, language),
            plan: formatShort(diary.plan, language),
          })
        : t('diary.zine.shareUnder', {
            pct: diary.closed.length ? Math.round((diary.under / diary.closed.length) * 100) : 0,
          }),
    },
  };
}

export type ZineView = ReturnType<typeof zineView>;
