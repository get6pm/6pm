import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FREE_ASKS_PER_DAY,
  answerQuery,
  freeAsksLeft,
  isAskIntent,
  type AskQuery,
  type LocalDate,
} from '@6pm/domain';

import { useMoneyActions, useMoneySelector, useMoneyStore } from '../../data/money-provider';
import { useMoneyFormat } from '../../money/use-money-format';
import { useI18n } from '../../i18n/i18n';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { useCompanionForm } from '../../ui/companion/companion-form';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { useApi } from '../api/native-api';
import { usePlanFormat } from '../plan/plan-format';
import { useEntitlement } from '../purchases/purchases-provider';
import { previousCycleStartOf, readEarlierSpends } from '../wording/insight-input';
import { readModelChoice } from '../wording/model-choice';
import { readAiMode } from '../privacy/ai-mode';
import type { PendingAction } from './ask-action-words';
import { cardOf, type AskWordsNow } from './ask-card';
import { askContextOf, askLedgerOf } from './ask-context';
import { readAskedOn, recordAsk } from './ask-quota-store';
import { readQuestion } from './ask-reader';
import { askSuggestions } from './ask-suggestions';
import { readTurns, turnKey, writeTurn } from './ask-turns-store';
import { plainCard, useAskAct } from './use-ask-act';
import type { AskCard } from './ask-words';

export type AskMessage =
  | { readonly id: string; readonly kind: 'me'; readonly text: string }
  | {
      readonly id: string;
      readonly kind: 'answer';
      readonly card: AskCard;
      readonly query: AskQuery | null;
      /** What the card's first button does, until it is answered. */
      readonly pending: PendingAction | null;
    };

export interface AskChat {
  readonly messages: readonly AskMessage[];
  readonly typing: boolean;
  /** The header companion's mood: thinking while an answer is coming, else the last answer's. */
  readonly mood: CompanionMood;
  /** Free questions left this week; null for Max or until the count is read. */
  readonly freeLeft: number | null;
  readonly freeTotal: number;
  /** The week's free questions are used and there is no Max: the input gives way to the lock. */
  readonly locked: boolean;
  readonly suggestions: readonly string[];
  /** Sends a question; opens Max instead when the week's free questions are used. */
  readonly send: (question: string) => Promise<void>;
  /** Answers an answer's buttons: `go` does what it offers, `cancel` leaves things as they are. */
  readonly act: (messageId: string, choice: 'go' | 'cancel') => Promise<void>;
  readonly openMax: () => void;
}

/** Readings sent with a question for follow-ups: the one before, and up to three before that. */
const HISTORY = 4;

/** The mood of the latest answer; the companion waves before anything has been asked. */
function lastMood(messages: readonly AskMessage[]): CompanionMood {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.kind === 'answer') return message.card.mood;
  }
  return 'wave';
}

/**
 * The Ask conversation: the free-question count (kept on this phone), reading each question
 * (server first, then the phone's rules) with the readings before it, working the answer out
 * from the user's real numbers, putting it in words, and doing what an answer offers once the
 * user taps it. The conversation is kept on the phone; nothing the user's money says leaves it.
 */
export function useAsk(): AskChat {
  const router = useRouter();
  const { t, language, weekday } = useI18n();
  const { today } = useClock();
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const api = useApi();
  const { max } = useEntitlement();
  const format = usePlanFormat(today);
  const money = useMoneyFormat();
  const potName = useMoneySelector((snap) => snap.pots[0]?.name ?? null);
  const db = useSQLiteContext();
  const { serious } = useTheme();
  const form = useCompanionForm();
  const persona = useMoneySelector((snap) => snap.plan?.persona ?? 'cheeky');
  // The readings so far, newest last, so "and last month?" reads as a follow-up.
  const history = useRef<AskQuery[]>([]);

  const [messages, setMessages] = useState<readonly AskMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [askedOn, setAskedOn] = useState<readonly LocalDate[] | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let live = true;
    readAskedOn(store.db).then(
      (days) => live && setAskedOn(days),
      (error: unknown) => {
        // The count is only a meter: without it the question still goes through, and the count
        // is read again, and enforced, when one is sent.
        Sentry.captureException(error);
      },
    );
    // The conversation so far, as it was left; its cards' buttons have had their moment.
    readTurns(store.db).then(
      (turns) => {
        if (!live) return;
        history.current = turns
          .flatMap((turn) => (turn.kind === 'answer' && turn.query !== null ? [turn.query] : []))
          .slice(-HISTORY);
        setMessages((now) => [
          ...turns.map((turn): AskMessage =>
            turn.kind === 'me'
              ? { id: turn.key, kind: 'me', text: turn.text }
              : { id: turn.key, kind: 'answer', card: turn.card, query: turn.query, pending: null },
          ),
          ...now,
        ]);
      },
      (error: unknown) => Sentry.captureException(error),
    );
    return () => {
      live = false;
    };
  }, [store]);

  const openMax = useCallback(() => {
    router.push({ pathname: '/max', params: { from: 'ask' } });
  }, [router]);

  // The latest words and clock, so a question asked a moment ago is answered in today's terms.
  const words = useRef<AskWordsNow & { today: LocalDate }>({
    t,
    language,
    weekday,
    format,
    money,
    today,
    serious,
    persona,
    form,
  });
  words.current = { t, language, weekday, format, money, today, serious, persona, form };

  /** Shows a message and keeps it on the phone. */
  const push = useCallback(
    (message: AskMessage) => {
      setMessages((all) => [...all, message]);
      const saved =
        message.kind === 'me'
          ? { key: message.id, kind: 'me' as const, text: message.text }
          : { key: message.id, kind: 'answer' as const, card: message.card, query: message.query };
      writeTurn(store.db, saved).catch((error: unknown) => Sentry.captureException(error));
    },
    [store],
  );

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (question === '' || busy.current) return;
      busy.current = true;
      const { today: day } = words.current;
      // Only questions the server reads count: on-device mode has no limit.
      const counted = !max && readAiMode(db) !== 'device';
      try {
        if (counted) {
          const asked = await readAskedOn(store.db);
          if (freeAsksLeft(asked, day) === 0) {
            setAskedOn(asked);
            openMax();
            return;
          }
        }
        push({ id: turnKey(), kind: 'me', text: question });
        setTyping(true);
        if (counted) {
          try {
            setAskedOn(await recordAsk(store.db, day));
          } catch (error) {
            // The answer is still given; the count missed one write.
            Sentry.captureException(error);
          }
        }
        const snapshot = store.getSnapshot();
        const before = history.current;
        const reading = await readQuestion(api, db, question, {
          today: snapshot.today,
          categories: snapshot.categories.map((c) => c.name),
          pots: snapshot.pots.map((pot) => pot.name),
          previous: before[before.length - 1] ?? null,
          earlier: before.slice(0, -1),
          merchants: [...new Set(snapshot.cycleSpends.map((spend) => spend.merchant))],
          currency: words.current.money.currency,
        });
        history.current = [...before, reading.query].slice(-HISTORY);
        // Worked out from the store as it is now, after the wait, with the cycle before it.
        const now = store.getSnapshot();
        const ctx = askContextOf(now);
        if (ctx === null) throw new Error('Ask was opened before the month was set up');
        const earlierFrom = previousCycleStartOf(now);
        const earlier =
          isAskIntent(reading.query) || earlierFrom === null
            ? []
            : await readEarlierSpends(store.db, earlierFrom, now.cycle.start);
        const answer = answerQuery(reading.query, ctx, askLedgerOf(now, earlier));
        const { card, pending } = await cardOf(answer, reading, question, {
          words: words.current,
          store,
          api,
          modelChoice: readModelChoice(db),
          settings: db,
          max,
          learnedCategory: (name) => actions.ruleCategory(name),
        });
        haptics.tap();
        push({ id: turnKey(), kind: 'answer', card, query: reading.query, pending });
      } catch (error) {
        Sentry.captureException(error);
        const card = plainCard(words.current.t('ask.error'), 'think');
        push({ id: turnKey(), kind: 'answer', card, query: null, pending: null });
      } finally {
        setTyping(false);
        busy.current = false;
      }
    },
    [actions, api, db, max, openMax, push, store],
  );

  const act = useAskAct({ messages, setMessages, words, actions });

  const freeLeft =
    max || askedOn === null || readAiMode(db) === 'device' ? null : freeAsksLeft(askedOn, today);
  const mood: CompanionMood = typing ? 'think' : lastMood(messages);
  const suggestions = useMemo(() => askSuggestions(t, potName, money), [t, potName, money]);

  return {
    messages,
    typing,
    mood,
    freeLeft,
    freeTotal: FREE_ASKS_PER_DAY,
    locked: freeLeft === 0,
    suggestions,
    send,
    act,
    openMax,
  };
}
