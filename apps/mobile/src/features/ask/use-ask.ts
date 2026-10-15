import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FREE_ASKS_PER_WEEK,
  answerQuery,
  fillLine,
  freeAsksLeft,
  isAskIntent,
  localDateOf,
  type AskAnswer,
  type AskQuery,
  type AskQueryAnswer,
  type LocalDate,
  type WordRequest,
} from '@6pm/domain';

import { useMoneySelector, useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { useApi } from '../api/native-api';
import { useCompanionForm } from '../../ui/companion/companion-form';
import { useTheme } from '../../ui/theme/theme';
import type { SlotWords } from '../wording/fact-words';
import { previousCycleStartOf, readEarlierSpends } from '../wording/insight-input';
import { readModelChoice } from '../wording/model-choice';
import { wordWithModel } from '../wording/word-chain';
import { describeLedgerAnswer } from './ask-ledger-words';
import { usePlanFormat } from '../plan/plan-format';
import { useEntitlement } from '../purchases/purchases-provider';
import { askContextOf, askLedgerOf } from './ask-context';
import { readAskedOn, recordAsk } from './ask-quota-store';
import { readQuestion } from './ask-reader';
import { askSuggestions } from './ask-suggestions';
import { describeAnswer, type AskCard } from './ask-words';

const ORIGINAL_ANSWERS: ReadonlySet<string> = new Set([
  'fitsToday',
  'notThisMonth',
  'tight',
  'fits',
  'weekend',
  'saveMore',
  'potFull',
  'noPots',
  'noSuchPot',
  'today',
  'help',
]);

/** One of the original engine's answers, which keep their original words. */
function isOriginalAnswer(answer: AskQueryAnswer): answer is AskAnswer {
  return ORIGINAL_ANSWERS.has(answer.kind);
}

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
  const money = useMoneyFormat();
  const potName = useMoneySelector((snap) => snap.pots[0]?.name ?? null);
  const db = useSQLiteContext();
  const { serious } = useTheme();
  const form = useCompanionForm();
  const persona = useMoneySelector((snap) => snap.plan?.persona ?? 'cheeky');
  // The query before, so "and last month?" reads as a follow-up.
  const previous = useRef<AskQuery | null>(null);

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
  const words = useRef({ t, language, weekday, format, money, today, serious, persona, form });
  words.current = { t, language, weekday, format, money, today, serious, persona, form };

  const push = useCallback((message: NewMessage) => {
    nextId.current += 1;
    const id = nextId.current;
    setMessages((all) => [...all, { ...message, id }]);
  }, []);

  /** The answer's card: catalogue words, or a model's when one answers in time. */
  const cardFor = useCallback(
    async (
      answer: AskQueryAnswer,
      reading: { readonly offline: boolean },
      categories: readonly { readonly id: string; readonly name: string }[],
      question: string,
    ): Promise<AskCard> => {
      const now = words.current;
      const env = {
        t: now.t,
        language: now.language,
        money: now.money,
        monthLong: now.format.monthLong,
        dayLongMonth: now.format.dayLongMonth,
        weekday: (d: string) => now.weekday(new Date(`${d}T12:00:00`)),
      };
      const ctx = askContextOf(store.getSnapshot());
      if (isOriginalAnswer(answer)) {
        if (ctx === null) throw new Error('Ask was opened before the month was set up');
        return describeAnswer(answer, ctx, reading, env);
      }
      const say = now.t as unknown as SlotWords['say'];
      const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';
      const voice = now.serious ? 'plain' : now.persona;
      const described = describeLedgerAnswer(answer, {
        ...env,
        categoryName,
        voice,
        slotWords: {
          ...env,
          say,
          categoryName,
          dayMonth: (date) => env.dayLongMonth(localDateOf(date)),
        },
      });
      if (described.wording === null || reading.offline) return described.card;
      const request: WordRequest = {
        surface: 'answer',
        language: now.language,
        persona: voice,
        companion: {
          name: say(`companions.name.${now.form}`),
          personality: say(`companions.line.${now.form}`),
        },
        facts: described.wording.facts.slice(0, 3).map((f) => ({
          kind: f.kind,
          slots: f.slots.slice(0, 8).map((s) => ({ name: s.name, value: s.value.slice(0, 40) })),
        })),
        question: question.slice(0, 300),
      };
      const line = await wordWithModel(request, {
        request: (r) => api.request(r),
        choice: readModelChoice(db),
      }).catch(() => null);
      return line === null
        ? described.card
        : {
            ...described.card,
            text: fillLine(line.text, described.wording.values),
            mood: line.mood,
          };
    },
    [api, db, store],
  );

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
        const reading = await readQuestion(api, question, {
          today: snapshot.today,
          categories: snapshot.categories.map((c) => c.name),
          pots: snapshot.pots.map((pot) => pot.name),
          previous: previous.current,
          currency: words.current.money.currency,
          merchants: [...new Set(snapshot.cycleSpends.map((spend) => spend.merchant))],
        });
        previous.current = reading.query;
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
        const card = await cardFor(answer, reading, now.categories, question);
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
    [api, cardFor, max, openMax, push, store],
  );

  const freeLeft = max || askedOn === null ? null : freeAsksLeft(askedOn, today);
  const mood: CompanionMood = typing ? 'think' : lastMood(messages);
  const suggestions = useMemo(() => askSuggestions(t, potName, money), [t, potName, money]);

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
