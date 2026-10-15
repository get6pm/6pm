import { useCallback, useMemo } from 'react';

import { notDailyOf, readMonthDiary, useStoreQuery } from '../../../data/diary-queries';
import { useMoney } from '../../../data/money-provider';
import type { MoneyStore } from '../../../data/money-store';
import { useI18n } from '../../../i18n/i18n';
import { useMoneyFormat } from '../../../money/use-money-format';
import { useDiaryDates } from '../diary-dates';
import { zineView } from './zine-view';

/** Everything a month's money diary prints, read from the database. Null while it loads. */
// `month` is 'YYYY-MM'.
export function useMoneyDiary(month: string, showAmounts: boolean) {
  const snap = useMoney();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const dates = useDiaryDates();
  const { plan, closedDays, cycleSpends, potSaved } = snap;
  const payday = useMemo(() => plan?.payday ?? { kind: 'lastDay' as const }, [plan]);
  const read = useCallback(
    (store: MoneyStore) => readMonthDiary(store, month, payday),
    [month, payday],
  );
  const watch = useMemo(
    () => ({ closedDays, cycleSpends, potSaved }),
    [closedDays, cycleSpends, potSaved],
  );
  const data = useStoreQuery(read, watch);
  if (data === null) return null;
  return zineView({
    month,
    data,
    categories: snap.categories,
    notDaily: notDailyOf(snap),
    t,
    money,
    dates,
    showAmounts,
  });
}
