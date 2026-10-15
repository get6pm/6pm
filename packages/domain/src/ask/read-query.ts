import { foldWords } from '../capture/spoken-spend';
import { parseAmount } from '../money/parse-amount';
import { readIntent } from './ask-intent';
import type { AskQuery, AskRange, AskRangePreset } from './ask-query';
import { categoryIn, goalWhatIn, merchantIn, overIn, potIn, rangesIn } from './read-query-parts';
import {
  BILLS,
  BREAKDOWN,
  CAN,
  CHAT,
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
): AskQuery | null {
  const spoken = f.trim().split(' ');
  const amount = parseAmount(question);
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

export function readQuery(
  question: string,
  names: ReadNames = {},
  previous: AskQuery | null = null,
): AskQuery {
  const f = foldWords(question);
  const pots = names.pots ?? [];
  const spoken = f.trim().split(' ');
  const amount = parseAmount(question);
  const ranges = rangesIn(f);

  if (spoken.length <= 4 && has(f, CHAT) && amount === null) return { kind: 'chat' };
  if (previous !== null) {
    const changed = followUp(question, f, previous, ranges);
    if (changed !== null) return changed;
  }

  // A goal months or years away: "khi nào mua được nhà", "how long to save for a car".
  const pot = potIn(f, pots);
  if (has(f, GOAL_WHEN)) {
    const what = goalWhatIn(question, f);
    if (pot !== undefined) return { kind: 'potFull', pot };
    if (what !== undefined) {
      return { kind: 'goal', what, ...(amount === null ? {} : { amount }) };
    }
  }

  // Pots, the weekend, saving and "can I" questions keep their original reading.
  const legacy = readIntent(question, pots);
  // A price with "can I" is about spending it, even when a pot's name is in the question.
  if (legacy.kind === 'potFull' && amount !== null && has(f, CAN)) {
    return { kind: 'afford', amount };
  }
  if (legacy.kind === 'potFull') {
    return legacy.pot === undefined && pot !== undefined ? { kind: 'potFull', pot } : legacy;
  }
  if (legacy.kind === 'weekend' || legacy.kind === 'saveMore') return legacy;
  if (has(f, BILLS) && !has(f, PAST) && amount === null) return { kind: 'bills' };
  if (has(f, CAN)) return legacy;
  if (has(f, HOW)) return { kind: 'howAmIDoing' };

  const category = categoryIn(f, names.categories ?? []);
  const merchant = merchantIn(question, f, names.merchants ?? []);
  const filters = {
    ...(category === undefined ? {} : { category }),
    ...(merchant === undefined ? {} : { merchant }),
  };

  // "Spends over 500k this month": a list with a floor, read before "more than" compares.
  const over = overIn(question);
  if (over !== undefined && !has(f, CAN)) {
    return { kind: 'list', range: range(ranges[0], 'thisWeek'), ...filters, minAmount: over };
  }
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
  const asksHowMuch = has(f, words('how much', 'bao nhieu'));
  if (has(f, PAST) || (asksHowMuch && (category !== undefined || merchant !== undefined))) {
    return { kind: 'spend', range: range(ranges[0], 'thisCycle'), ...filters };
  }
  if (legacy.kind === 'unknown' && has(f, HOW_LOOSE)) return { kind: 'howAmIDoing' };
  return legacy;
}
