import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';

import type { DailyNumber } from '@6pm/domain';

import { readDayNumber } from '../../data/diary-queries';
import { useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { haptics } from '../../ui/haptics';
import type { useClose } from './use-close';

/**
 * Closes the day and leaves the Close: from the reveal's Done, or by folding the iPhone Duo shut.
 * Runs once; a failed save lets it be tried again.
 */
export function useFinishClose(close: ReturnType<typeof useClose>, day: DailyNumber | null) {
  const router = useRouter();
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const finishing = useRef(false);
  const { run, settle } = close;
  const closing = close.day;

  return useCallback(async () => {
    if (finishing.current || !day) return;
    finishing.current = true;
    const saved = await run(async () => {
      // Worked out for the closed day itself, with the cash just added, so a close that crossed
      // 04:00 still files that day's receipt.
      const number = (await readDayNumber(store, store.getSnapshot(), closing)) ?? day;
      await actions.closeDay({
        day: closing,
        closedAt: new Date().toISOString(),
        late: false,
        spent: number.spent,
        line: number.line,
        tomorrow: number.tomorrow,
        note: null,
      });
    });
    if (!saved) {
      finishing.current = false;
      return;
    }
    settle();
    haptics.success();
    router.back();
  }, [day, run, settle, closing, store, actions, router]);
}
