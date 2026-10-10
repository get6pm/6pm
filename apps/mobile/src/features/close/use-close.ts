import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import {
  closeReducer,
  needsReview,
  remainingCards,
  startClose,
  type CardVerdict,
  type SpendRow,
} from '@6pm/domain';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useSpendLabels, useSpendRows } from '../today/use-spend-rows';
import type { CloseCardContent } from './close-card';

const UNDO_MS = 4500;
const SORTED_MS = 1700;
/** A spend worth asking about: big enough to plausibly be claimed back, read from a receipt. */
const WORK_QUESTION_MIN = 100_000;

/**
 * The close for today's waiting spends: the tested state machine, plus writing each decision to
 * the database the moment it is made (so leaving mid-close loses nothing; reopening resumes with
 * whatever is still waiting).
 */
export function useClose() {
  const snap = useMoney();
  const actions = useMoneyActions();
  const { t } = useI18n();
  const labels = useSpendLabels();

  // The queue is fixed when the close opens; its order never changes underneath the user.
  const [queue] = useState<readonly SpendRow[]>(() =>
    snap.cycleSpends
      .filter((s) => s.day === snap.today && needsReview(s))
      .sort((a, b) => (a.at < b.at ? -1 : 1)),
  );
  const askWorkId = useMemo(() => {
    const candidates = queue.filter(
      (s) => s.amount >= WORK_QUESTION_MIN && (s.source === 'shared' || s.source === 'email'),
    );
    return candidates.sort((a, b) => b.amount - a.amount)[0]?.id ?? null;
  }, [queue]);
  const [state, dispatch] = useReducer(
    closeReducer,
    queue.map((s) => ({ id: s.id, askWork: s.id === askWorkId })),
    startClose,
  );
  const rows = useSpendRows(queue);
  const categories = useMemo(
    () => new Map(snap.categories.map((c) => [c.id, c])),
    [snap.categories],
  );
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const keptBefore = queue
    .filter((s) => state.verdicts[s.id] === 'kept' || state.verdicts[s.id] === 'edited')
    .reduce((sum, s) => sum + (snap.cycleSpends.find((c) => c.id === s.id)?.amount ?? s.amount), 0);
  const remaining = remainingCards(state);
  const cards: CloseCardContent[] = remaining.map((card) => {
    const spend = queue.find((s) => s.id === card.id);
    const row = rows.find((r) => r.id === card.id);
    const index = queue.findIndex((s) => s.id === card.id);
    if (!spend || !row) throw new Error('A close card lost its spend');
    return {
      row,
      no: t('close.card.no', {
        n: String(index + 1).padStart(2, '0'),
        total: String(queue.length).padStart(2, '0'),
        source: labels.source(spend.source),
      }),
      source: labels.source(spend.source),
      time: labels.time(spend.at),
      category: categories.get(spend.categoryId)?.name ?? '',
      amount: spend.amount,
      keptBefore,
      detail: spend.detail,
      labels: {
        keptSoFar: t('close.card.keptSoFar'),
        withThis: t('close.card.withThis'),
        keep: t('close.stamp.keep'),
        edit: t('close.stamp.edit'),
        notMine: t('close.stamp.notMine'),
      },
    };
  });

  const decide = useCallback(
    (id: string, verdict: CardVerdict) => {
      dispatch({ type: 'decide', id, verdict });
      void actions.setStatus(id, verdict === 'notMine' ? 'skipped' : 'kept');
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => dispatch({ type: 'undoExpired' }), UNDO_MS);
    },
    [actions],
  );
  const undo = useCallback(() => {
    if (!state.undoable) return;
    haptics.tap();
    void actions.undo(state.undoable);
    dispatch({ type: 'undo' });
  }, [actions, state.undoable]);

  // The sorted beat moves on by itself.
  useEffect(() => {
    if (state.step !== 'sorted') return;
    haptics.success();
    const timer = setTimeout(() => dispatch({ type: 'sortedShown' }), SORTED_MS);
    return () => clearTimeout(timer);
  }, [state.step]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const undone = state.undoable ? queue.find((s) => s.id === state.undoable) : undefined;
  const undoText = undone
    ? t(
        state.verdicts[undone.id] === 'notMine'
          ? 'close.undoSkipped'
          : state.verdicts[undone.id] === 'edited'
            ? 'close.undoEdited'
            : 'close.undoKept',
        { name: undone.merchant },
      )
    : null;

  return { state, dispatch, queue, cards, decide, undo, undoText, askWorkId, keptBefore };
}
