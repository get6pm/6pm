import * as Sentry from '@sentry/react-native';
import { useEffect, useState } from 'react';

import type { DailyNumber, LocalDate } from '@6pm/domain';

import { readDayNumber } from '../../data/diary-queries';
import { useDay, useMoney, useMoneyStore } from '../../data/money-provider';

/**
 * The daily number of the day being closed. Normally that is today's number. A close that ran
 * past 04:00 is still closing the day before, whose number is worked out from that day alone, so
 * its receipt and the reveal show what that day was and not the new day's fresh line.
 */
export function useClosingNumber(closing: LocalDate): DailyNumber | null {
  const store = useMoneyStore();
  const snap = useMoney();
  const today = useDay();
  const [past, setPast] = useState<DailyNumber | null>(null);
  const crossed = snap.today !== closing;

  useEffect(() => {
    if (!crossed) return;
    let live = true;
    readDayNumber(store, snap, closing).then(
      (number) => {
        if (live) setPast(number);
      },
      (error: unknown) => Sentry.captureException(error),
    );
    return () => {
      live = false;
    };
  }, [store, snap, closing, crossed]);

  return crossed ? past : today;
}
