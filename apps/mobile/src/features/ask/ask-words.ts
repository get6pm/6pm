import {
  formatShort,
  formatVnd,
  type AskAnswer,
  type AskContext,
  type LocalDate,
} from '@6pm/domain';
import type { Language, ParamsArgument, StringKey } from '@6pm/i18n';

import type { CompanionMood } from '../../ui/companion/companion-mood';

/** What the words need from the app: the catalogue and the date names in the interface language. */
export interface AskWordsEnv {
  readonly t: <Key extends StringKey>(key: Key, ...params: ParamsArgument<Key>) => string;
  readonly language: Language;
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
  const { t, language } = env;
  const share = bars.before > 0 ? Math.round((Math.max(0, bars.after) / bars.before) * 100) : 0;
  return {
    nowValue: t('ask.bar.perDay', { amount: formatShort(bars.before, language) }),
    afterValue:
      bars.after > 0
        ? t('ask.bar.perDay', { amount: formatShort(bars.after, language) })
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
  const { t, language } = env;
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
      return card(
        t('ask.answer.fitsToday', { safe: formatShort(answer.safe, language) }),
        'happy',
        {
          bars: barsOf(env, answer.bars),
          rows: [
            row('ask.row.safeToday', formatVnd(answer.safe)),
            row('ask.row.this', `− ${formatVnd(answer.amount)}`),
            row('ask.row.tomorrow', formatVnd(answer.bars.after)),
          ],
        },
      );
    case 'fits':
      return card(
        t('ask.answer.fits', {
          from: formatShort(answer.bars.before, language),
          to: formatShort(answer.bars.after, language),
        }),
        'happy',
        {
          bars: barsOf(env, answer.bars),
          rows: afford(row, answer.free, answer.amount, answer.bars.after),
        },
      );
    case 'tight': {
      const { fromPots } = answer;
      return card(
        t('ask.answer.tight', {
          from: formatShort(answer.bars.before, language),
          to: formatShort(answer.bars.after, language),
        }),
        'nod',
        {
          bars: barsOf(env, answer.bars),
          rows: afford(row, answer.free, answer.amount, answer.bars.after),
          note:
            fromPots === null
              ? null
              : t('ask.answer.tight.pots', {
                  take: formatShort(fromPots.take, language),
                  withPots: formatShort(fromPots.withPots, language),
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
          rows: afford(row, answer.free, answer.amount, 0),
          note: ctx.pots.length > 0 ? t('ask.answer.notThisMonth.pots') : null,
        },
      );
    case 'weekend': {
      const [first, second] = answer.days;
      if (first === undefined) {
        return card(t('ask.answer.weekend.none', { payday: env.dayLongMonth(ctx.payday) }), 'calm');
      }
      const total = formatShort(answer.total, language);
      const text =
        second === undefined
          ? t('ask.answer.weekend.one', { total, first: env.weekday(first.day) })
          : t('ask.answer.weekend.two', {
              total,
              first: env.weekday(first.day),
              second: env.weekday(second.day),
            });
      return card(text, 'calm', {
        rows: answer.days.map((d) => ({ key: env.weekday(d.day), value: formatVnd(d.amount) })),
      });
    }
    case 'saveMore': {
      const amount = formatShort(answer.amount, language);
      const text =
        answer.perDay > 0
          ? t('ask.answer.saveMore', { amount, perDay: formatShort(answer.perDay, language) })
          : t('ask.answer.saveMore.none', { amount });
      return card(text, 'calm', {
        bars: barsOf(env, answer.bars),
        rows: [
          row('ask.row.futureYou', formatVnd(answer.futureYou)),
          row('ask.row.moving', `+ ${formatVnd(answer.amount)}`),
        ],
        note: t('ask.answer.saveMore.note'),
      });
    }
    case 'potFull': {
      const { pot } = answer;
      const rows = [
        row('ask.row.inPot', formatVnd(pot.saved)),
        row('ask.row.goal', formatVnd(pot.goal)),
        row('ask.row.perMonth', formatVnd(pot.monthly)),
      ];
      if (answer.full)
        return card(t('ask.answer.potFull.done', { pot: pot.name }), 'happy', { rows });
      if (answer.fullIn === null) {
        return card(t('ask.answer.potFull.idle', { pot: pot.name }), 'calm', { rows });
      }
      return card(
        t('ask.answer.potFull', {
          monthly: formatShort(pot.monthly, language),
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
              safe: formatShort(answer.safe, language),
              tomorrow: formatShort(answer.tomorrow, language),
            })
          : t('ask.answer.today.used', { tomorrow: formatShort(answer.tomorrow, language) }),
        'calm',
        {
          rows: [
            row('ask.row.safeToday', formatVnd(Math.max(0, answer.safe))),
            row('ask.row.tomorrow', formatVnd(answer.tomorrow)),
          ],
        },
      );
    case 'help':
      return card(t('ask.answer.help'), 'think', {
        note: reading.offline ? t('ask.answer.offline') : null,
      });
  }
}

/** The three lines under an affordability answer. */
function afford(
  row: ReturnType<typeof rowMaker>,
  free: number,
  amount: number,
  after: number,
): AskCard['rows'] {
  return [
    row('ask.row.free', formatVnd(free)),
    row('ask.row.this', `− ${formatVnd(amount)}`),
    row('ask.row.leftPerDay', formatVnd(Math.max(0, after))),
  ];
}
