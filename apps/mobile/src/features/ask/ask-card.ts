import {
  fillLine,
  localDateOf,
  type ActionAnswer,
  type AskAnswer,
  type AskQueryAnswer,
  type WordRequest,
} from '@6pm/domain';

import type { MoneyStore } from '../../data/money-store';
import type { useI18n } from '../../i18n/i18n';
import type { ApiClient } from '../api/api-client';
import type { useMoneyFormat } from '../../money/use-money-format';
import type { usePlanFormat } from '../plan/plan-format';
import { newPotLocked } from '../plan/plan-view';
import type { SlotWords, Voice } from '../wording/fact-words';
import type { ModelChoice } from '../wording/model-choice';
import { wordWithModel } from '../wording/word-chain';
import { describeAction, type PendingAction } from './ask-action-words';
import { askContextOf } from './ask-context';
import { describeLedgerAnswer } from './ask-ledger-words';
import { spendCategoryOf } from './ask-spend-category';
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
const ACTION_ANSWERS: ReadonlySet<string> = new Set([
  'confirmSpend',
  'confirmPot',
  'potGoal',
  'howTo',
]);

/** The words and clock an answer is put in, as they are when it is answered. */
export interface AskWordsNow {
  readonly t: ReturnType<typeof useI18n>['t'];
  readonly language: ReturnType<typeof useI18n>['language'];
  readonly weekday: ReturnType<typeof useI18n>['weekday'];
  readonly format: ReturnType<typeof usePlanFormat>;
  readonly money: ReturnType<typeof useMoneyFormat>;
  readonly serious: boolean;
  readonly persona: Voice;
  readonly form: string;
}

export interface AskCardDeps {
  readonly words: AskWordsNow;
  readonly store: MoneyStore;
  readonly api: Pick<ApiClient, 'request'>;
  readonly modelChoice: ModelChoice;
  readonly max: boolean;
  /** A rule the user taught 6pm for a spend's name, if any. */
  readonly learnedCategory: (name: string) => Promise<string | null>;
}

/** An answer's card, and what its first button does when it offers to do something. */
export interface AnsweredCard {
  readonly card: AskCard;
  readonly pending: PendingAction | null;
}

/**
 * The answer's card: the catalogue's words, or a model's when one answers in time. An answer that
 * offers to do something comes with what its button will do; nothing is done until it is tapped.
 */
export async function cardOf(
  answer: AskQueryAnswer,
  reading: { readonly offline: boolean },
  question: string,
  deps: AskCardDeps,
): Promise<AnsweredCard> {
  const now = deps.words;
  const snap = deps.store.getSnapshot();
  const env = {
    t: now.t,
    language: now.language,
    money: now.money,
    monthLong: now.format.monthLong,
    dayLongMonth: now.format.dayLongMonth,
    weekday: (d: string) => now.weekday(new Date(`${d}T12:00:00`)),
  };
  if (ORIGINAL_ANSWERS.has(answer.kind)) {
    const ctx = askContextOf(snap);
    if (ctx === null) throw new Error('Ask was opened before the month was set up');
    return { card: describeAnswer(answer as AskAnswer, ctx, reading, env), pending: null };
  }
  const say = now.t as unknown as SlotWords['say'];
  const categories = snap.categories;
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';
  const voice: Voice = now.serious ? 'plain' : now.persona;
  const wordsEnv = {
    ...env,
    categoryName,
    voice,
    slotWords: {
      ...env,
      say,
      categoryName,
      dayMonth: (date: Date) => env.dayLongMonth(localDateOf(date)),
    },
  };
  if (ACTION_ANSWERS.has(answer.kind)) {
    const action = answer as ActionAnswer;
    const categoryId =
      action.kind === 'confirmSpend'
        ? spendCategoryOf(
            {
              name: action.name,
              named: action.category,
              learned: await deps.learnedCategory(action.name).catch(() => null),
              hour: new Date().getHours(),
            },
            categories,
          )
        : '';
    return describeAction(action, wordsEnv, {
      categoryId,
      potLocked: newPotLocked(snap.pots, deps.max),
    });
  }
  const described = describeLedgerAnswer(
    answer as Parameters<typeof describeLedgerAnswer>[0],
    wordsEnv,
  );
  if (described.wording === null || reading.offline) return { card: described.card, pending: null };
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
    request: (r) => deps.api.request(r),
    choice: deps.modelChoice,
  }).catch(() => null);
  const card =
    line === null
      ? described.card
      : { ...described.card, text: fillLine(line.text, described.wording.values), mood: line.mood };
  return { card, pending: null };
}
