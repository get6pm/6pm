import * as Sentry from '@sentry/react-native';
import { useEffect, useState } from 'react';

import { useMoneyStore } from '../../data/money-provider';
import { readCycleTopUps, type CycleTopUps } from '../../data/pot-moves';
import type { MoneySnapshot } from '../../data/money-store';

/**
 * This cycle's top-ups split between goals and occasions, re-read whenever the total or the
 * cycle changes; null until the first read lands.
 */
export function useCycleTopUps(snap: MoneySnapshot): CycleTopUps | null {
  const store = useMoneyStore();
  const [split, setSplit] = useState<CycleTopUps | null>(null);
  const { topUpsThisCycle } = snap;
  const { start } = snap.cycle;
  useEffect(() => {
    let live = true;
    if (topUpsThisCycle === 0) {
      setSplit({ goal: 0, occasion: 0 });
      return;
    }
    readCycleTopUps(store).then(
      (next) => {
        if (live) setSplit(next);
      },
      // The river keeps the last split, and the total is right either way.
      (error: unknown) => Sentry.captureException(error),
    );
    return () => {
      live = false;
    };
  }, [store, topUpsThisCycle, start]);
  return split;
}
