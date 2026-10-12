import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import {
  closeQueue,
  closeReducer,
  receiptBankOf,
  remainingCards,
  startClose,
  type CardVerdict,
  type CloseState,
  type SpendRow,
} from '@6pm/domain';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { findSpend } from '../../data/money-store';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useRunAction } from '../companion/use-run-action';
import { useSpendLabels, useSpendRows } from '../today/use-spend-rows';
import type { CloseCardContent } from './close-card';
import { clearClose, parkClose, parkedClose } from './close-session';
import type { CashChip } from './close-steps';

const UNDO_MS = 4500;
const SORTED_MS = 1700;
/** A spend worth asking about: big enough to plausibly be claimed back, read from a receipt. */
const WORK_QUESTION_MIN = 100_000;

interface Start {
  readonly queue: readonly SpendRow[];
  readonly state: CloseState;
  readonly cash: readonly CashChip[];
}

/**
 * The close opens on the day's waiting spends, or where it was left: a close parked past the
 * cards step picks up at that step with the same queue and the cash already added. Waiting
 * spends from earlier days are part of the queue.
 */
function startOf(spends: readonly SpendRow[], day: string): Start {
  const parked = parkedClose(day);
  if (parked !== null && parked.state.step !== 'cards' && parked.state.step !== 'done') {
    const byId = new Map(spends.map((s) => [s.id, s]));
    return {
      queue: parked.queueIds.flatMap((id) => byId.get(id) ?? []),
      state: closeReducer(parked.state, { type: 'resume' }),
      cash: parked.cash,
    };
  }
  const queue = closeQueue(spends, day);
  const askWorkId = workCandidate(queue);
  return {
    queue,
    state: startClose(queue.map((s) => ({ id: s.id, askWork: s.id === askWorkId }))),
    cash: [],
  };
}

function workCandidate(queue: readonly SpendRow[]): string | null {
  const candidates = queue.filter(
    (s) => s.amount >= WORK_QUESTION_MIN && (s.source === 'shared' || s.source === 'email'),
  );
  return [...candidates].sort((a, b) => b.amount - a.amount)[0]?.id ?? null;
}

/**
 * The close for the day's waiting spends: the tested state machine, plus writing each decision to
 * the database the moment it is made (so leaving mid-close loses nothing). Leaving parks the
 * close at its step; reopening resumes it.
 */
export function useClose() {
  const snap = useMoney();
  const actions = useMoneyActions();
  const run = useRunAction();
  const { t, language } = useI18n();
  const labels = useSpendLabels();
  // The day being closed is fixed when the close opens, even if the money day turns over under it.
  const [day] = useState(snap.today);

  // Fixed when the close opens; its order never changes underneath the user.
  const [start] = useState(() => startOf([...snap.cycleSpends, ...snap.waitingBefore], day));
  const { queue } = start;
  const askWorkId = useMemo(() => workCandidate(queue), [queue]);
  const [state, dispatch] = useReducer(closeReducer, start.state);
  const [cash, setCash] = useState<readonly CashChip[]>(start.cash);
  const rows = useSpendRows(queue);
  const categories = useMemo(
    () => new Map(snap.categories.map((c) => [c.id, c])),
    [snap.categories],
  );
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const weekday = useMemo(
    () => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'short' }),
    [language],
  );

  // Leaving by any route parks the close where it stands, unless the day was closed.
  const latest = useRef({ state, cash });
  useEffect(() => {
    latest.current = { state, cash };
  });
  const finished = useRef(false);
  const queueIds = useMemo(() => queue.map((s) => s.id), [queue]);
  useEffect(
    () => () => {
      if (finished.current) return;
      const { state: left, cash: added } = latest.current;
      parkClose({
        day,
        // Leaving the reveal keeps the reveal; every other step pauses as the machine says.
        state:
          left.step === 'reveal'
            ? { ...left, paused: true }
            : closeReducer(left, { type: 'pause' }),
        queueIds,
        cash: added,
      });
    },
    [day, queueIds],
  );
  /** The day is closed: nothing is left to resume. */
  const settle = useCallback(() => {
    finished.current = true;
    clearClose();
  }, []);

  const keptBefore = queue
    .filter((s) => state.verdicts[s.id] === 'kept' || state.verdicts[s.id] === 'edited')
    .reduce((sum, s) => sum + (findSpend(snap, s.id)?.amount ?? s.amount), 0);
  // A shared receipt names its bank as the prototype words it; other sources show their detail.
  const cardDetail = (spend: SpendRow) => {
    const bank = spend.source === 'shared' ? receiptBankOf(spend.detail) : null;
    return bank ? t('close.card.readFrom', { bank }) : spend.detail;
  };
  const remaining = remainingCards(state);
  const cards: CloseCardContent[] = remaining.map((card) => {
    const spend = queue.find((s) => s.id === card.id);
    const row = rows.find((r) => r.id === card.id);
    const index = queue.findIndex((s) => s.id === card.id);
    if (!spend || !row) throw new Error('A close card lost its spend');
    const time = labels.time(spend.at);
    return {
      row,
      no: t('close.card.no', {
        n: String(index + 1).padStart(2, '0'),
        total: String(queue.length).padStart(2, '0'),
        source: labels.source(spend.source),
      }),
      source: labels.source(spend.source),
      // A waiting spend from an earlier day says which day.
      time: spend.day < day ? `${weekday.format(new Date(spend.at))} ${time}` : time,
      category: categories.get(spend.categoryId)?.name ?? '',
      amount: spend.amount,
      keptBefore,
      detail: cardDetail(spend),
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
    (id: string, verdict: CardVerdict, edit?: { amount: number; categoryId: string }) => {
      dispatch({ type: 'decide', id, verdict });
      void run(() => actions.setStatus(id, verdict === 'notMine' ? 'skipped' : 'kept', edit));
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => dispatch({ type: 'undoExpired' }), UNDO_MS);
    },
    [actions, run],
  );
  const undo = useCallback(() => {
    const id = state.undoable;
    if (!id) return;
    haptics.tap();
    // An edit changed the amount and category too; undoing puts the card back as it arrived.
    const original = queue.find((s) => s.id === id);
    const restore =
      state.verdicts[id] === 'edited' && original
        ? { amount: original.amount, categoryId: original.categoryId }
        : {};
    void run(() => actions.undo(id, restore));
    dispatch({ type: 'undo' });
  }, [actions, run, queue, state.undoable, state.verdicts]);

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

  return {
    day,
    state,
    dispatch,
    queue,
    cards,
    decide,
    undo,
    undoText,
    askWorkId,
    keptBefore,
    cash,
    setCash,
    settle,
    run,
  };
}
