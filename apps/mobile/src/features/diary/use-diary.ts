import { useCallback, useMemo, useState } from 'react';

import {
  calendarCells,
  diaryShelf,
  floorToThousand,
  formatShort,
  monthEnd,
  monthOf,
  previousMonth,
  nextMonthStart,
  startOfWeek,
  underCount,
  weekRecap,
  type ClosedDayRow,
} from '@6pm/domain';

import {
  notDailyOf,
  readClosedBetween,
  readDayReceipt,
  readDiary,
  toDiarySpend,
  useStoreQuery,
  type DiaryData,
} from '../../data/diary-queries';
import { useDay, useMoneySelector } from '../../data/money-provider';
import type { MoneySnapshot } from '../../data/money-store';
import type { MoneyStore } from '../../data/money-store';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDiaryRequest } from '../today/diary-request';
import { useDiaryDates } from './diary-dates';
import type { DayReceiptView } from './day-receipt';

/** The closed day filed most recently: the one the receipt shows until the user picks another. */
function latestFiled(closed: readonly ClosedDayRow[]): ClosedDayRow | null {
  return closed.reduce<ClosedDayRow | null>(
    (latest, d) => (latest === null || d.closedAt > latest.closedAt ? d : latest),
    null,
  );
}

const NO_DAYS: readonly ClosedDayRow[] = [];

/** The parts of the snapshot the Diary reads: a write to anything else leaves it alone. */
const diaryInputs = ({ today, closedDays, cycleSpends, categories }: MoneySnapshot) => ({
  today,
  closedDays,
  cycleSpends,
  categories,
});
const sameInputs = (a: ReturnType<typeof diaryInputs>, b: ReturnType<typeof diaryInputs>) =>
  a.today === b.today &&
  a.closedDays === b.closedDays &&
  a.cycleSpends === b.cycleSpends &&
  a.categories === b.categories;

/**
 * Everything the Diary tab shows, from the database through the domain maths. Closing a day (here
 * or late, from the missed-day sheet) selects it, as the prototype does. The calendar opens on
 * this month and pages back through the months 6pm has days for.
 *
 * The snapshot already holds this month's and this week's closed days; the queries below re-run
 * only when a closed day or a spend changed, not for every write the store publishes.
 */
export function useDiary() {
  const day = useDay();
  const { today, closedDays, cycleSpends, categories } = useMoneySelector(diaryInputs, sameInputs);
  const { t, language } = useI18n();
  const dates = useDiaryDates();
  const current = monthOf(today);
  const monday = startOfWeek(today);
  const [paged, setPaged] = useState<string | null>(null);
  // A month the clock has moved past (or one that is today's again) falls back to this month.
  const month = paged !== null && paged < current ? paged : current;
  const watch = useMemo(() => ({ closedDays, cycleSpends }), [closedDays, cycleSpends]);

  const readPage = useCallback(
    (store: MoneyStore): Promise<DiaryData> => readDiary(store, { from: monday, to: today }),
    [monday, today],
  );
  const data = useStoreQuery(readPage, watch);

  const readEarlier = useCallback(
    (store: MoneyStore) =>
      month === current
        ? Promise.resolve(null)
        : readClosedBetween(store, `${month}-01`, monthEnd(month)),
    [month, current],
  );
  const earlier = useStoreQuery(readEarlier, watch);
  const monthClosed = useMemo(
    () =>
      month === current ? closedDays.filter((d) => monthOf(d.day) === month) : (earlier ?? NO_DAYS),
    [month, current, closedDays, earlier],
  );
  const weekClosed = useMemo(
    () => closedDays.filter((d) => d.day >= monday && d.day <= today),
    [closedDays, monday, today],
  );
  const firstMonth = data?.since ? monthOf(data.since) : null;
  const page = useCallback(
    (by: 1 | -1) => {
      haptics.tick();
      setPaged((from) => {
        const at = from !== null && from < current ? from : current;
        const next = by === -1 ? previousMonth(at) : monthOf(nextMonthStart(at));
        return next < current ? next : null;
      });
    },
    [current],
  );
  const latest = latestFiled(monthClosed);
  const [pick, setPick] = useState<{ readonly day: string; readonly after: string } | null>(null);
  // Today's week strip and closed card ask for a day's receipt; each request is taken up once.
  const request = useDiaryRequest();
  const [taken, setTaken] = useState(request?.token ?? 0);
  if (request !== null && request.token !== taken) {
    setTaken(request.token);
    setPaged(null);
    setPick({ day: request.day, after: latest?.closedAt ?? '' });
  }
  const selected =
    pick !== null && pick.after === latest?.closedAt && monthClosed.some((d) => d.day === pick.day)
      ? pick.day
      : (latest?.day ?? null);
  const select = useCallback(
    (picked: string) => {
      haptics.tick();
      setPick({ day: picked, after: latest?.closedAt ?? '' });
    },
    [latest],
  );

  const notDaily = useMemo(() => notDailyOf({ categories }), [categories]);
  const readReceipt = useCallback(
    (store: MoneyStore) =>
      selected ? readDayReceipt(store, selected, notDaily) : Promise.resolve(null),
    [selected, notDaily],
  );
  const receiptData = useStoreQuery(readReceipt, watch);

  const line = day?.line ?? 0;
  const recap = useMemo(
    () =>
      weekRecap({
        today,
        line,
        closed: weekClosed,
        spends: (data?.weekSpends ?? []).map(toDiarySpend),
        notDaily,
      }),
    [today, line, data, weekClosed, notDaily],
  );

  const row = monthClosed.find((d) => d.day === receiptData?.day);
  const receipt: DayReceiptView | null =
    row && receiptData
      ? {
          day: row.day,
          title: dates.stamp(row.day),
          no: t('diary.receipt.no', { no: receiptData.no }),
          rows: receiptData.spends.map((s) => ({
            time: dates.clock(s.at),
            name: s.merchant.toLocaleUpperCase(),
            amount: s.amount,
          })),
          empty: t('diary.receipt.empty'),
          totalLabel: t('close.receipt.total'),
          total: row.spent,
          note:
            row.note ??
            (row.late
              ? t('diary.receipt.lateNote')
              : row.spent === 0
                ? t('close.receipt.noteQuiet')
                : t('close.receipt.note')),
          stamp: t('close.receipt.closed'),
          closedAt: row.late ? t('diary.receipt.late') : dates.clock(row.closedAt),
        }
      : null;

  const under = underCount(monthClosed);
  // Earlier months show the line their own days kept, not today's.
  const monthLine =
    month === current || monthClosed.length === 0
      ? line
      : floorToThousand(monthClosed.reduce((sum, d) => sum + d.line, 0) / monthClosed.length);
  return {
    ready: data !== null,
    kicker: t('diary.kicker', {
      closed: closedDays.filter((d) => monthOf(d.day) === current).length,
      month: dates.month(current),
      all: data?.allClosed ?? 0,
    }),
    recap,
    recapKicker: t('diary.recap.kicker', { range: dates.range(monday, today) }),
    letters: dates.letters(monday),
    monthTitle: dates.month(month),
    summary:
      monthClosed.length === 0
        ? t('diary.cal.summaryNone')
        : t('diary.cal.summary', {
            closed: monthClosed.length,
            under,
            line: formatShort(monthLine, language),
          }),
    cells: calendarCells({ month, today, closed: monthClosed, since: data?.since ?? null }),
    selected,
    select,
    receipt,
    canPrevious: firstMonth !== null && month > firstMonth,
    canNext: month < current,
    page,
    shelf: diaryShelf(today, data?.months ?? []),
    year: today.slice(0, 4),
  };
}
