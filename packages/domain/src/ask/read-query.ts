import { foldWords } from '../capture/spoken-spend';
import { designAmount, VND, type Currency } from '../money/currency';
import { parseAmount } from '../money/parse-amount';
import type { AskQuery, AskRange, AskRangePreset } from './ask-query';
import { chatTopicIn, urgentTopicIn } from './read-chat';
import {
  ACTION,
  BUY,
  CAN_SPEND,
  FULLNESS,
  HOW_MUCH,
  MONTH_NAMES,
  MORE,
  NOT_YET,
  PAST_WEEKEND,
  POT_WORDS,
  SAVE,
  SAVE_FOR,
  WEEKEND,
  WHAT_IF,
} from './read-query-guards';
import {
  categoryIn,
  goalWhatIn,
  merchantIn,
  moneyIn,
  overIn,
  potIn,
  rangesIn,
} from './read-query-parts';
import {
  BILLS,
  BREAKDOWN,
  CAN,
  COMPARE,
  GOAL_WHEN,
  HOW,
  HOW_LOOSE,
  LIST,
  PAST,
  has,
  words,
} from './read-query-words';

/**
 * Reads a question into a query with rules alone, in English or Vietnamese: the tier used when
 * neither the server nor the phone's model can answer. Patterns run on folded text (no accents,
 * lower case, words padded with spaces), so "tuần này" and "tuan nay" read the same.
 */

/** What helps the rules read a question. Merchants are the user's own places, kept on the phone. */
export interface ReadNames {
  readonly pots?: readonly string[];
  readonly categories?: readonly string[];
  readonly merchants?: readonly string[];
}

/** The span now that a span before stands for. */
const CURRENT_OF: Partial<Record<AskRangePreset, AskRangePreset>> = {
  yesterday: 'today',
  lastWeek: 'thisWeek',
  lastMonth: 'thisMonth',
  lastCycle: 'thisCycle',
};

const range = (preset: AskRangePreset | undefined, fallback: AskRangePreset): AskRange => ({
  preset: preset ?? fallback,
});

/** A query a short follow-up changes ("what about last month?", "3 tỷ"), or null. */
function followUp(
  question: string,
  f: string,
  previous: AskQuery,
  ranges: readonly AskRangePreset[],
  currency: Currency,
): AskQuery | null {
  const spoken = f.trim().split(' ');
  const amount = parseAmount(question, currency);
  if (previous.kind === 'goal' && previous.amount === undefined && amount !== null) {
    return spoken.length <= 4 ? { ...previous, amount } : null;
  }
  const cued = [PAST, LIST, COMPARE, BREAKDOWN, CAN, BILLS, HOW].some((list) => has(f, list));
  const [first] = ranges;
  if (cued || first === undefined || spoken.length > 6) return null;
  if (previous.kind === 'spend' || previous.kind === 'breakdown' || previous.kind === 'list') {
    return { ...previous, range: { preset: first } };
  }
  if (previous.kind === 'compare') {
    const { against: _against, ...rest } = previous;
    return { ...rest, range: { preset: first } };
  }
  return null;
}

/** Plans ahead: a goal, the weekend, a price, saving more, a pot. Null when it is none of them. */
function readPlan(
  question: string,
  f: string,
  amount: number | null,
  pots: readonly string[],
  currency: Currency,
): AskQuery | null {
  const pot = potIn(f, pots);
  const lastTime = has(f, LIST) && has(f, words('lan cuoi', 'last time', 'when did i last'));
  if ((has(f, GOAL_WHEN) || has(f, SAVE_FOR)) && !lastTime) {
    if (pot !== undefined) return { kind: 'potFull', pot } as const;
    const what = goalWhatIn(question, f);
    if (what !== undefined) return { kind: 'goal', what, ...(amount === null ? {} : { amount }) };
  }
  if (has(f, PAST_WEEKEND)) return UNKNOWN;
  if (has(f, WEEKEND) && amount === null && !has(f, COMPARE)) return { kind: 'weekend' } as const;
  if (has(f, NOT_YET)) return UNKNOWN;
  const saving = has(f, SAVE);
  if (saving && has(f, WHAT_IF) && (amount !== null || has(f, MORE))) {
    return { kind: 'saveMore', amount: amount ?? designAmount(500_000, currency) } as const;
  }
  if (saving && amount !== null && has(f, MORE)) return { kind: 'saveMore', amount } as const;
  if (amount !== null && !saving && (has(f, CAN) || has(f, BUY))) {
    return { kind: 'afford', amount } as const;
  }
  if (pot !== undefined && (has(f, FULLNESS) || has(f, POT_WORDS) || saving)) {
    return { kind: 'potFull', pot } as const;
  }
  if (has(f, POT_WORDS) && has(f, FULLNESS)) return { kind: 'potFull' } as const;
  if (
    amount === null &&
    (has(f, CAN_SPEND) || (has(f, CAN) && has(f, words('today', 'hom nay'))))
  ) {
    return { kind: 'today' } as const;
  }
  // A change the rules cannot work out ("nếu tăng lương 2tr thì sao"): better unknown than a guess.
  if (has(f, WHAT_IF) || has(f, CAN) || amount !== null) return UNKNOWN;
  return null;
}

const UNKNOWN = { kind: 'unknown' } as const;

export function readQuery(
  question: string,
  names: ReadNames = {},
  previous: AskQuery | null = null,
  currency: Currency = VND,
): AskQuery {
  const f = foldWords(question);
  const spoken = f.trim().split(' ');
  const amount = moneyIn(question, currency);
  const ranges = rangesIn(f);

  const urgent = urgentTopicIn(f, amount !== null);
  if (urgent !== undefined) return { kind: 'chat', topic: urgent };
  const topic = amount === null ? chatTopicIn(f, spoken.length) : undefined;
  if (topic !== undefined) return { kind: 'chat', topic };
  if (previous !== null) {
    const changed = followUp(question, f, previous, ranges, currency);
    if (changed !== null) return changed;
  }
  // Logging a spend, making a pot or setting a budget is not something Ask does yet.
  if (has(f, ACTION)) return UNKNOWN;
  if (has(f, HOW)) return { kind: 'howAmIDoing' };
  if (has(f, BILLS) && !has(f, PAST) && amount === null) {
    return { kind: 'bills' };
  }
  // "Spends over 500k this month": a list with a floor, not a price.
  if (overIn(question, currency) !== undefined)
    return readLookup(question, f, spoken.length, ranges, names, currency);
  const plan = readPlan(question, f, amount, names.pots ?? [], currency);
  if (plan !== null) return plan;
  return readLookup(question, f, spoken.length, ranges, names, currency);
}

/** Lookups in the user's records: a span, a category or place, a list, a comparison. */
function readLookup(
  question: string,
  f: string,
  spoken: number,
  ranges: readonly AskRangePreset[],
  names: ReadNames,
  currency: Currency,
): AskQuery {
  const category = categoryIn(f, names.categories ?? []);
  const merchant = merchantIn(question, f, names.merchants ?? []);
  const named = category !== undefined || merchant !== undefined;
  const filters = {
    ...(category === undefined ? {} : { category }),
    ...(merchant === undefined ? {} : { merchant }),
  };

  // "Spends over 500k this month": a list with a floor, read before "more than" compares.
  const over = overIn(question, currency);
  if (over !== undefined) {
    return { kind: 'list', range: range(ranges[0], 'thisWeek'), ...filters, minAmount: over };
  }
  // A month by name needs its year, which the model works out from the date: not the rules.
  if (has(f, MONTH_NAMES) && ranges.length === 0) return UNKNOWN;
  if (has(f, COMPARE)) {
    const [first, second] = ranges;
    // "More than last month?" names only the span to compare against: the other is this one.
    const current = first === undefined ? undefined : CURRENT_OF[first];
    if (first !== undefined && second === undefined && current !== undefined) {
      return {
        kind: 'compare',
        range: { preset: current },
        against: { preset: first },
        ...filters,
      };
    }
    return {
      kind: 'compare',
      range: range(first, 'thisCycle'),
      ...(second === undefined ? {} : { against: { preset: second } }),
      ...filters,
    };
  }
  if (has(f, BREAKDOWN)) return { kind: 'breakdown', range: range(ranges[0], 'thisCycle') };
  if (has(f, LIST)) return { kind: 'list', range: range(ranges[0], 'thisWeek'), ...filters };
  const short = spoken <= 6 && ranges.length > 0;
  if (has(f, PAST) || (named && (has(f, HOW_MUCH) || short))) {
    return { kind: 'spend', range: range(ranges[0], 'thisCycle'), ...filters };
  }
  if (has(f, HOW_LOOSE)) return { kind: 'howAmIDoing' };
  // "Hôm nay?" on its own asks about today's number.
  if (ranges.length === 1 && ranges[0] === 'today') return { kind: 'today' };
  return UNKNOWN;
}
