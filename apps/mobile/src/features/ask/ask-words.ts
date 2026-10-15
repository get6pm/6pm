import { type AskAnswer, type MoneyFormat, type AskContext, type LocalDate } from '@6pm/domain';
import type { Language, ParamsArgument, StringKey } from '@6pm/i18n';

import type { CompanionMood } from '../../ui/companion/companion-mood';
import { askExamples } from './ask-suggestions';

/** What the words need from the app: the catalogue and the date names in the interface language. */
export interface AskWordsEnv {
  readonly t: <Key extends StringKey>(key: Key, ...params: ParamsArgument<Key>) => string;
  readonly language: Language;
  /** Money in the home currency, in the interface language and the phone's number style. */
  readonly money: MoneyFormat;
  /** "February 2027" */
  readonly monthLong: (month: string) => string;
  /** "31 October" */
  readonly dayLongMonth: (day: LocalDate) => string;
  /** "Saturday" */
  readonly weekday: (day: LocalDate) => string;
}

/** The Now / After bars under an answer. `after` is a share of `now`, for the bar's length. */
export interface AskBarsView {
  readonly nowValue: string;
  readonly afterValue: string;
  /** 3–100: the After bar as a share of the Now bar, never thinner than a sliver. */
  readonly afterPercent: number;
}

export interface AskCard {
  readonly text: string;
  readonly mood: CompanionMood;
  readonly bars: AskBarsView | null;
  readonly rows: readonly { readonly key: string; readonly value: string }[];
  readonly note: string | null;
}

/** How the answer arrived: offline, the question was read with rules and may be missed. */
export interface AskReading {
  readonly offline: boolean;
}

const MIN_BAR_PERCENT = 3;

type RowKey = Extract<StringKey, `ask.row.${string}`>;

/** A label and a value; the labels take no parameters. */
function rowMaker(env: AskWordsEnv) {
  return (key: RowKey, value: string): AskCard['rows'][number] => ({
    key: env.t(key as 'ask.row.free'),
    value,
  });
}

function barsOf(
  env: AskWordsEnv,
  bars: { readonly before: number; readonly after: number },
): AskBarsView {
  const { t, money } = env;
  const share = bars.before > 0 ? Math.round((Math.max(0, bars.after) / bars.before) * 100) : 0;
  return {
    nowValue: t('ask.bar.perDay', { amount: money.short(bars.before) }),
    afterValue:
      bars.after > 0
        ? t('ask.bar.perDay', { amount: money.short(bars.after) })
        : t('ask.bar.nothing'),
    afterPercent: Math.min(100, Math.max(MIN_BAR_PERCENT, share)),
  };
}

/**
 * The words for an answer: calm sentences from the catalogue with the numbers the domain worked
 * out, in the interface language. No number is made here; each is formatted from the answer.
 */
export function describeAnswer(
  answer: AskAnswer,
  ctx: AskContext,
  reading: AskReading,
  env: AskWordsEnv,
): AskCard {
  const { t, money } = env;
  const row = rowMaker(env);
  const card = (
    text: string,
    mood: CompanionMood,
    parts: Partial<Pick<AskCard, 'bars' | 'rows' | 'note'>> = {},
  ): AskCard => ({
    text,
    mood,
    bars: parts.bars ?? null,
    rows: parts.rows ?? [],
    note: parts.note ?? null,
  });

  switch (answer.kind) {
    case 'fitsToday':
      return card(t('ask.answer.fitsToday', { safe: money.short(answer.safe) }), 'happy', {
        bars: barsOf(env, answer.bars),
        rows: [
          row('ask.row.safeToday', money.full(answer.safe)),
          row('ask.row.this', `− ${money.full(answer.amount)}`),
          row('ask.row.tomorrow', money.full(answer.bars.after)),
        ],
      });
    case 'fits':
      return card(
        t('ask.answer.fits', {
          from: money.short(answer.bars.before),
          to: money.short(answer.bars.after),
        }),
        'happy',
        {
          bars: barsOf(env, answer.bars),
          rows: afford(row, money, answer.free, answer.amount, answer.bars.after),
        },
      );
    case 'tight': {
      const { fromPots } = answer;
      return card(
        t('ask.answer.tight', {
          from: money.short(answer.bars.before),
          to: money.short(answer.bars.after),
        }),
        'nod',
        {
          bars: barsOf(env, answer.bars),
          rows: afford(row, money, answer.free, answer.amount, answer.bars.after),
          note:
            fromPots === null
              ? null
              : t('ask.answer.tight.pots', {
                  take: money.short(fromPots.take),
                  withPots: money.short(fromPots.withPots),
                }),
        },
      );
    }
    case 'notThisMonth':
      return card(
        t('ask.answer.notThisMonth', { payday: env.dayLongMonth(answer.payday) }),
        'nod',
        {
          bars: barsOf(env, answer.bars),
          rows: afford(row, money, answer.free, answer.amount, 0),
          note: ctx.pots.length > 0 ? t('ask.answer.notThisMonth.pots') : null,
        },
      );
    case 'weekend': {
      const [first, second] = answer.days;
      if (first === undefined) {
        return card(t('ask.answer.weekend.none', { payday: env.dayLongMonth(ctx.payday) }), 'calm');
      }
      const total = money.short(answer.total);
      const text =
        second === undefined
          ? t('ask.answer.weekend.one', { total, first: env.weekday(first.day) })
          : t('ask.answer.weekend.two', {
              total,
              first: env.weekday(first.day),
              second: env.weekday(second.day),
            });
      return card(text, 'calm', {
        rows: answer.days.map((d) => ({ key: env.weekday(d.day), value: money.full(d.amount) })),
      });
    }
    case 'saveMore': {
      const amount = money.short(answer.amount);
      const text =
        answer.perDay > 0
          ? t('ask.answer.saveMore', { amount, perDay: money.short(answer.perDay) })
          : t('ask.answer.saveMore.none', { amount });
      return card(text, 'calm', {
        bars: barsOf(env, answer.bars),
        rows: [
          row('ask.row.futureYou', money.full(answer.futureYou)),
          row('ask.row.moving', `+ ${money.full(answer.amount)}`),
        ],
        note: t('ask.answer.saveMore.note'),
      });
    }
    case 'potFull': {
      const { pot } = answer;
      const rows = [
        row('ask.row.inPot', money.full(pot.saved)),
        row('ask.row.goal', money.full(pot.goal)),
        row('ask.row.perMonth', money.full(pot.monthly)),
      ];
      if (answer.full)
        return card(t('ask.answer.potFull.done', { pot: pot.name }), 'happy', { rows });
      if (answer.fullIn === null) {
        return card(t('ask.answer.potFull.idle', { pot: pot.name }), 'calm', { rows });
      }
      return card(
        t('ask.answer.potFull', {
          monthly: money.short(pot.monthly),
          pot: pot.name,
          month: env.monthLong(answer.fullIn),
        }),
        'happy',
        { rows },
      );
    }
    case 'noPots':
      return card(t('ask.answer.noPots'), 'think');
    case 'noSuchPot':
      return card(t('ask.answer.noSuchPot', { pot: answer.name }), 'think');
    case 'today':
      return card(
        answer.safe > 0
          ? t('ask.answer.today', {
              safe: money.short(answer.safe),
              tomorrow: money.short(answer.tomorrow),
            })
          : t('ask.answer.today.used', { tomorrow: money.short(answer.tomorrow) }),
        'calm',
        {
          rows: [
            row('ask.row.safeToday', money.full(Math.max(0, answer.safe))),
            row('ask.row.tomorrow', money.full(answer.tomorrow)),
          ],
        },
      );
    case 'help':
      return card(t('ask.answer.help', { amount: askExamples(money).dinner }), 'think', {
        note: reading.offline ? t('ask.answer.offline') : null,
      });
  }
}

/** The three lines under an affordability answer. */
function afford(
  row: ReturnType<typeof rowMaker>,
  money: MoneyFormat,
  free: number,
  amount: number,
  after: number,
): AskCard['rows'] {
  return [
    row('ask.row.free', money.full(free)),
    row('ask.row.this', `− ${money.full(amount)}`),
    row('ask.row.leftPerDay', money.full(Math.max(0, after))),
  ];
}
