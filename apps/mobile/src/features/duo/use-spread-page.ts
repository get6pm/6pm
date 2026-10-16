import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { DiaryDayView } from './diary-bridge';
import type { PaneView } from './spread-pane';

/**
 * What the right page of the opened iPhone Duo is showing, and the ways into it: a spend or Ask
 * opened from the left page, the Diary's chosen day, and the amount Ask was last asked about.
 * Shut part way through a spend or Ask, it carries on in its sheet on the outer screen.
 */
export function useSpreadPage(spread: boolean) {
  const router = useRouter();
  const [pane, setPane] = useState<PaneView>({ kind: 'month' });
  const [diaryDay, setDiaryDay] = useState<DiaryDayView | null>(null);
  const [affording, setAffording] = useState<number | null>(null);
  const openSpend = useCallback((id: string) => setPane({ kind: 'spend', id }), []);
  const openAsk = useCallback(
    (question: string | null) => setPane({ kind: 'ask', question, opened: Date.now() }),
    [],
  );
  const back = useCallback(() => setPane({ kind: 'month' }), []);

  const carried: Href | null =
    pane.kind === 'spend' ? `/spend/${pane.id}` : pane.kind === 'ask' ? '/ask' : null;
  useEffect(() => {
    if (spread || carried === null) return;
    setPane({ kind: 'month' });
    router.push(carried);
  }, [spread, carried, router]);

  return { pane, openSpend, openAsk, back, diaryDay, setDiaryDay, affording, setAffording };
}
