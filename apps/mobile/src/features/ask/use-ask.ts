import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FREE_ASKS_PER_WEEK, answerAsk, freeAsksLeft, type LocalDate } from '@6pm/domain';

import { useMoneySelector, useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { useApi } from '../api/native-api';
import { usePlanFormat } from '../plan/plan-format';
import { useEntitlement } from '../purchases/purchases-provider';
import { askContextOf } from './ask-context';
import { readAskedOn, recordAsk } from './ask-quota-store';
import { readQuestion } from './ask-reader';
import { askSuggestions } from './ask-suggestions';
import { describeAnswer, type AskCard } from './ask-words';

export type AskMessage =
  | { readonly id: number; readonly kind: 'me'; readonly text: string }
  | { readonly id: number; readonly kind: 'answer'; readonly card: AskCard };

type NewMessage =
  | { readonly kind: 'me'; readonly text: string }
  | { readonly kind: 'answer'; readonly card: AskCard };

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
  readonly openMax: () => void;
}

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
 * (server first, then the phone's rules), working the answer out from the user's real numbers and
 * putting it in words. Nothing the user's money says leaves the phone.
 */
export function useAsk(): AskChat {
  const router = useRouter();
  const { t, language, weekday } = useI18n();
  const { today } = useClock();
  const store = useMoneyStore();
  const api = useApi();
  const { max } = useEntitlement();
  const format = usePlanFormat(today);
  const firstPotName = useMoneySelector((snap) => snap.pots[0]?.name ?? null);

  const [messages, setMessages] = useState<readonly AskMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [askedOn, setAskedOn] = useState<readonly LocalDate[] | null>(null);
  const busy = useRef(false);
  const nextId = useRef(0);

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
    return () => {
      live = false;
    };
  }, [store]);

  const openMax = useCallback(() => {
    router.push({ pathname: '/max', params: { from: 'ask' } });
  }, [router]);

  // The latest words and clock, so a question asked a moment ago is answered in today's terms.
  const words = useRef({ t, language, weekday, format, today });
  words.current = { t, language, weekday, format, today };

  const push = useCallback((message: NewMessage) => {
    nextId.current += 1;
    const id = nextId.current;
    setMessages((all) => [...all, { ...message, id }]);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (question === '' || busy.current) return;
      busy.current = true;
      const { today: day } = words.current;
      try {
        if (!max) {
          const asked = await readAskedOn(store.db);
          if (freeAsksLeft(asked, day) === 0) {
            setAskedOn(asked);
            openMax();
            return;
          }
        }
        push({ kind: 'me', text: question });
        setTyping(true);
        if (!max) {
          try {
            setAskedOn(await recordAsk(store.db, day));
          } catch (error) {
            // The answer is still given; the count missed one write.
            Sentry.captureException(error);
          }
        }
        const snapshot = store.getSnapshot();
        const reading = await readQuestion(
          api,
          question,
          snapshot.pots.map((pot) => pot.name),
        );
        // Worked out from the store as it is now, after the wait.
        const ctx = askContextOf(store.getSnapshot());
        if (ctx === null) throw new Error('Ask was opened before the month was set up');
        const now = words.current;
        const card = describeAnswer(answerAsk(reading.intent, ctx), ctx, reading, {
          t: now.t,
          language: now.language,
          monthLong: now.format.monthLong,
          dayLongMonth: now.format.dayLongMonth,
          weekday: (d) => now.weekday(new Date(`${d}T12:00:00`)),
        });
        haptics.tap();
        push({ kind: 'answer', card });
      } catch (error) {
        Sentry.captureException(error);
        push({
          kind: 'answer',
          card: {
            text: words.current.t('ask.error'),
            mood: 'think',
            bars: null,
            rows: [],
            note: null,
          },
        });
      } finally {
        setTyping(false);
        busy.current = false;
      }
    },
    [api, max, openMax, push, store],
  );

  const freeLeft = max || askedOn === null ? null : freeAsksLeft(askedOn, today);
  const mood: CompanionMood = typing ? 'think' : lastMood(messages);
  const suggestions = useMemo(() => askSuggestions(t, firstPotName), [t, firstPotName]);

  return {
    messages,
    typing,
    mood,
    freeLeft,
    freeTotal: FREE_ASKS_PER_WEEK,
    locked: freeLeft === 0,
    suggestions,
    send,
    openMax,
  };
}
