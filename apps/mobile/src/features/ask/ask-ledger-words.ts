import {
  slotsOf,
  type ActionAnswer,
  type AskAnswer,
  type AskQueryAnswer,
  type ResolvedRange,
  type WordFact,
} from '@6pm/domain';

import { catalogueLine, slotValues, type SlotWords, type Voice } from '../wording/fact-words';
import { describeChat } from './ask-chat-words';
import { goalPriceExample } from './ask-suggestions';
import type { AskCard, AskWordsEnv } from './ask-words';

/** The answers read from the user's records, as opposed to the original six. */
export type LedgerAnswer = Exclude<AskQueryAnswer, AskAnswer | ActionAnswer>;

export interface LedgerWordsEnv extends AskWordsEnv {
  readonly categoryName: (id: string) => string;
  /** The words a fact's slots become, for "how am I doing". */
  readonly slotWords: SlotWords;
  readonly voice: Voice;
}

/** What a model may word instead of the catalogue: the answer's facts and their values. */
export interface AnswerWording {
  readonly facts: readonly WordFact[];
  readonly values: Readonly<Record<string, string>>;
}

export interface LedgerCard {
  readonly card: AskCard;
  /** Null when the catalogue's words are all there is to say. */
  readonly wording: AnswerWording | null;
}

/** Catalogue keys built at run time; each takes the params its answer gives. */
type Say = (key: string, params?: Readonly<Record<string, string | number>>) => string;

function capitalised(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

function rangeText(env: LedgerWordsEnv, range: ResolvedRange): string {
  const say = env.t as unknown as Say;
  return range.preset === null
    ? say('ask.range.dates', { from: env.dayLongMonth(range.from), to: env.dayLongMonth(range.to) })
    : say(`ask.range.${range.preset}`);
}

function card(
  text: string,
  mood: AskCard['mood'],
  rows: AskCard['rows'] = [],
  note: string | null = null,
): AskCard {
  return { text, mood, bars: null, rows, note };
}

/** One answer kind and its values, as a model words it. */
function single(kind: string, values: Record<string, string>): AnswerWording {
  return {
    facts: [{ kind, slots: Object.entries(values).map(([name, value]) => ({ name, value })) }],
    values,
  };
}

/**
 * The words for an answer read from the user's records: a sentence from the catalogue and rows
 * of the numbers behind it, plus what a model may word it from. Every number is the domain's.
 */
export function describeLedgerAnswer(answer: LedgerAnswer, env: LedgerWordsEnv): LedgerCard {
  const say = env.t as unknown as Say;
  const short = (amount: number) => env.money.short(amount);
  const partial = (yes: boolean, since: string) =>
    yes ? say('ask.answer.partial', { since: env.dayLongMonth(since) }) : null;

  switch (answer.kind) {
    case 'spent': {
      const { spent } = answer;
      const values: Record<string, string> = {
        total: short(spent.total),
        range: rangeText(env, spent.range),
        count: String(spent.count),
      };
      let key = 'spent';
      if (answer.categoryId !== null) {
        values['category'] = env.categoryName(answer.categoryId);
        key = 'spentOn';
      } else if (answer.merchant !== null) {
        values['merchant'] = answer.merchant;
        key = 'spentAt';
      }
      const none = spent.count === 0;
      const text = none
        ? say(`ask.answer.${key.replace('spent', 'spentNone')}`, values)
        : say(`ask.answer.${key}`, { ...values, count: spent.count });
      const rows = answer.places.map((p) => ({ key: p.merchant, value: env.money.full(p.amount) }));
      return {
        card: card(text, none ? 'calm' : 'think', rows, partial(answer.partial, spent.range.from)),
        wording: none ? null : single('spent', values),
      };
    }
    case 'breakdown': {
      const { spent } = answer;
      const range = rangeText(env, spent.range);
      const top = answer.categories[0];
      if (top === undefined) {
        return { card: card(say('ask.answer.spentNone', { range }), 'calm'), wording: null };
      }
      const values = {
        total: short(spent.total),
        range,
        top: env.categoryName(top.categoryId),
      };
      const rows = answer.categories.map((c) => ({
        key: env.categoryName(c.categoryId),
        value: env.money.full(c.amount),
      }));
      return {
        card: card(
          say('ask.answer.breakdown', values),
          'think',
          rows,
          partial(answer.partial, spent.range.from),
        ),
        wording: single('breakdown', values),
      };
    }
    case 'compared': {
      const range = rangeText(env, answer.now.range);
      const against = rangeText(env, answer.before.range);
      const values: Record<string, string> = {
        now: short(answer.now.total),
        before: short(answer.before.total),
        range,
        against,
      };
      if (answer.categoryId !== null) values['category'] = env.categoryName(answer.categoryId);
      if (answer.merchant !== null) values['merchant'] = answer.merchant;
      const up = answer.compare === 'more' || answer.compare === 'muchMore';
      const key = answer.compare === 'about' ? 'same' : up ? 'up' : 'down';
      const rows = [
        { key: capitalised(range), value: env.money.full(answer.now.total) },
        { key: capitalised(against), value: env.money.full(answer.before.total) },
      ];
      return {
        card: card(
          say(`ask.answer.compared.${key}`, values),
          up ? 'nod' : 'happy',
          rows,
          partial(answer.partial, answer.before.range.from),
        ),
        wording: single('compared', values),
      };
    }
    case 'listed': {
      const range = rangeText(env, answer.range);
      const count = answer.spends.length + answer.more;
      if (count === 0) {
        return { card: card(say('ask.answer.listedNone', { range }), 'calm'), wording: null };
      }
      const values = { count: String(count), range, total: short(answer.total) };
      const rows = answer.spends.map((s) => ({
        key: `${s.merchant} · ${env.dayLongMonth(s.day)}`,
        value: env.money.full(s.amount),
      }));
      const notes = [
        answer.more > 0 ? say('ask.answer.listedMore', { more: answer.more }) : null,
        partial(answer.partial, answer.range.from),
      ].filter((n): n is string => n !== null);
      return {
        card: card(
          say('ask.answer.listed', { ...values, count }),
          'think',
          rows,
          notes.length === 0 ? null : notes.join(' '),
        ),
        wording: single('listed', values),
      };
    }
    case 'bills': {
      if (answer.due.length === 0) {
        return { card: card(say('ask.answer.billsNone'), 'happy'), wording: null };
      }
      const values = { count: String(answer.due.length), total: short(answer.total) };
      const rows = answer.due.map((b) => ({
        key: `${b.name} · ${env.dayLongMonth(b.on)}`,
        value: env.money.full(b.amount),
      }));
      return {
        card: card(say('ask.answer.bills', { ...values, count: answer.due.length }), 'think', rows),
        wording: single('bills', values),
      };
    }
    case 'howAmIDoing': {
      if (answer.facts.length === 0) {
        return { card: card(say('ask.answer.howNothing'), 'calm'), wording: null };
      }
      const lines = answer.facts.map((fact) => catalogueLine(fact, env.voice, 0, env.slotWords));
      // Each fact's slots keep their names, made unique across facts with a letter.
      const values: Record<string, string> = {};
      const facts = answer.facts.map((fact, i) => {
        const suffix = i === 0 ? '' : String.fromCharCode(65 + i);
        const own = slotValues(fact, env.slotWords);
        const slots = Object.keys(slotsOf(fact)).map((name) => {
          values[`${name}${suffix}`] = own[name] ?? '';
          return { name: `${name}${suffix}`, value: own[name] ?? '' };
        });
        return { kind: fact.kind, slots };
      });
      return {
        card: card([say('ask.answer.how'), ...lines].join(' '), 'happy'),
        wording: { facts, values },
      };
    }
    case 'goalPace': {
      const values = {
        monthly: short(answer.monthly),
        amount: short(answer.amount),
        what: answer.what,
        month: env.monthLong(answer.reachedIn),
      };
      const text =
        answer.years === null
          ? say('ask.answer.goalPace.months', { ...values, count: answer.months })
          : say('ask.answer.goalPace.years', { ...values, count: answer.years });
      const rows = [
        { key: say('ask.row.goal'), value: env.money.full(answer.amount) },
        { key: say('ask.row.perMonth'), value: env.money.full(answer.monthly) },
        { key: say('ask.row.reachedBy'), value: values.month },
      ];
      return {
        card: card(text, 'think', rows, say('ask.answer.goalPace.note')),
        wording: single('goalPace', {
          ...values,
          count: String(answer.years ?? answer.months),
          unit: answer.years === null ? 'months' : 'years',
        }),
      };
    }
    case 'goalNoPace':
      return {
        card: card(
          say('ask.answer.goalNoPace', { amount: short(answer.amount), what: answer.what }),
          'calm',
        ),
        wording: null,
      };
    case 'goalAmount':
      return {
        card: card(
          say('ask.answer.goalAmount', {
            what: answer.what,
            example: goalPriceExample(env.money),
          }),
          'think',
        ),
        wording: null,
      };
    case 'noSuchCategory':
      return {
        card: card(say('ask.answer.noSuchCategory', { category: answer.name }), 'think'),
        wording: null,
      };
    case 'noRange':
      return { card: card(say('ask.answer.noRange'), 'think'), wording: null };
    case 'chat':
      return describeChat(answer, env);
  }
}
