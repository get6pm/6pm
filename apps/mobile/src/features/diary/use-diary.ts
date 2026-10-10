import { useCallback, useMemo, useState } from 'react';

import {
  calendarCells,
  diaryShelf,
  formatShort,
  monthOf,
  startOfWeek,
  underCount,
  weekRecap,
  type ClosedDayRow,
} from '@6pm/domain';

import {
  notDailyOf,
  readDayReceipt,
  readDiary,
  toDiarySpend,
  useStoreQuery,
  type DiaryData,
} from '../../data/diary-queries';
import { useDay, useMoney } from '../../data/money-provider';
import type { MoneyStore } from '../../data/money-store';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDiaryDates } from './diary-dates';
import type { DayReceiptView } from './day-receipt';

/** The closed day filed most recently: the one the receipt shows until the user picks another. */
function latestFiled(closed: readonly ClosedDayRow[]): ClosedDayRow | null {
  return closed.reduce<ClosedDayRow | null>(
    (latest, d) => (latest === null || d.closedAt > latest.closedAt ? d : latest),
    null,
  );
}

/**
 * Everything the Diary tab shows, from the database through the domain maths. Closing a day (here
 * or late, from the missed-day sheet) selects it, as the prototype does.
 */
export function useDiary() {
  const snap = useMoney();
  const day = useDay();
  const { t } = useI18n();
  const dates = useDiaryDates();
  const { today } = snap;
  const month = monthOf(today);
  const monday = startOfWeek(today);

  const readPage = useCallback(
    (store: MoneyStore): Promise<DiaryData> => readDiary(store, month, { from: monday, to: today }),
    [month, monday, today],
  );
  const data = useStoreQuery(readPage);

  const monthClosed = useMemo(() => data?.monthClosed ?? [], [data]);
  const latest = latestFiled(monthClosed);
  const [pick, setPick] = useState<{ readonly day: string; readonly after: string } | null>(null);
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

  const readReceipt = useCallback(
    (store: MoneyStore) => (selected ? readDayReceipt(store, selected) : Promise.resolve(null)),
    [selected],
  );
  const receiptData = useStoreQuery(readReceipt);

  const line = day?.line ?? 0;
  const notDaily = useMemo(() => notDailyOf(snap), [snap]);
  const recap = useMemo(
    () =>
      weekRecap({
        today,
        line,
        closed: data?.weekClosed ?? [],
        spends: (data?.weekSpends ?? []).map(toDiarySpend),
        notDaily,
      }),
    [today, line, data, notDaily],
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
  return {
    ready: data !== null,
    kicker: t('diary.kicker', {
      closed: monthClosed.length,
      month: dates.month(month),
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
            line: formatShort(line),
          }),
    cells: calendarCells({ month, today, closed: monthClosed, since: data?.since ?? null }),
    selected,
    select,
    receipt,
    shelf: diaryShelf(today, data?.months ?? []),
    year: today.slice(0, 4),
  };
}
