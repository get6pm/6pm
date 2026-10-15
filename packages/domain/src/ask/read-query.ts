import { foldWords } from '../capture/spoken-spend';
import { parseAmount } from '../money/parse-amount';
import { readIntent } from './ask-intent';
import type { AskQuery, AskRange, AskRangePreset } from './ask-query';

/**
 * Reads a question into a query with rules alone, in English or Vietnamese: the tier used when
 * neither the server nor the phone's model can answer. Patterns run on folded text (no accents,
 * lower case, words padded with spaces), so "tuần này" and "tuan nay" read the same.
 */

const words = (...list: string[]) => list.map((w) => ` ${w} `);
const has = (f: string, list: readonly string[]) => list.some((w) => f.includes(w));

/** Spans in the order they are tried: "last" before "this", so "last week" is not "this week". */
const RANGE_WORDS: readonly (readonly [AskRangePreset, readonly string[]])[] = [
  ['yesterday', words('yesterday', 'hom qua')],
  ['today', words('today', 'hom nay')],
  ['lastWeek', words('last week', 'tuan truoc', 'tuan roi')],
  ['thisWeek', words('this week', 'tuan nay')],
  ['lastMonth', words('last month', 'thang truoc', 'thang roi')],
  ['thisMonth', words('this month', 'thang nay')],
  ['last7Days', words('last 7 days', 'past 7 days', '7 ngay qua', '7 ngay')],
  ['last30Days', words('last 30 days', 'past 30 days', '30 ngay qua', '30 ngay')],
  ['lastCycle', words('last cycle', 'last pay cycle', 'ky luong truoc')],
  [
    'thisCycle',
    words('this cycle', 'this pay cycle', 'ky luong nay', 'since payday', 'tu luc nhan luong'),
  ],
];

const CHAT = words(
  'thanks',
  'thank you',
  'thx',
  'ty',
  'cam on',
  'hi',
  'hello',
  'hey',
  'chao',
  'xin chao',
  'ok',
  'oke',
);
const CAN = words(
  'can i',
  'could i',
  'should i',
  'afford',
  'duoc khong',
  'duoc ko',
  'duoc bao nhieu',
  'con bao nhieu',
  'con lai',
  'nen',
);
const BILLS = words('bill', 'bills', 'hoa don', 'tien dien', 'tien nuoc', 'den han', 'due');
const HOW = words(
  'how am i doing',
  'how s my',
  'how is my',
  'how are my',
  'the nao roi',
  'on khong',
  'sao roi',
  'on ko',
  'tinh hinh',
);
const COMPARE = words(
  'compare',
  'compared',
  'vs',
  'versus',
  'than last',
  'than the',
  'so voi',
  'so sanh',
  'more than',
  'less than',
  'nhieu hon',
  'it hon',
);
const BREAKDOWN = words(
  'where did',
  'where does',
  'where s my money',
  'breakdown',
  'di dau',
  'vao dau',
  'vao gi',
  'on what',
  'gom nhung gi',
);
const LIST = words(
  'show me',
  'list',
  'what did i buy',
  'what have i bought',
  'liet ke',
  'mua gi',
  'xem lai',
  'nhung khoan',
  'cac khoan',
);
const PAST = words(
  'did i spend',
  'have i spent',
  'i spent',
  'spent',
  'spend on',
  'da tieu',
  'da xai',
  'da chi',
  'tieu het',
  'xai het',
  'het bao nhieu',
  'tieu bao nhieu',
  'xai bao nhieu',
  'chi bao nhieu',
  'bao nhieu tien',
);
/** Words a merchant name never runs into: where it stops after "at" / "ở". */
const STOP = new Set([
  'this',
  'last',
  'today',
  'yesterday',
  'the',
  'on',
  'in',
  'for',
  'tuan',
  'thang',
  'hom',
  'nay',
  'roi',
  'het',
  'bao',
  'nhieu',
  'khong',
  'ko',
  'chua',
  'vay',
  'a',
  'nhe',
]);
const AT = /(?:^| )(?:at|o|tai)( [a-z0-9]+(?: [a-z0-9]+){0,2})/;

function rangesIn(f: string): AskRangePreset[] {
  const found: { preset: AskRangePreset; at: number }[] = [];
  let rest = f;
  for (const [preset, list] of RANGE_WORDS) {
    for (const w of list) {
      const at = rest.indexOf(w);
      if (at === -1) continue;
      found.push({ preset, at });
      // Blank it out so "this week" does not also read inside a longer phrase already taken.
      rest = rest.slice(0, at) + ' '.repeat(w.length) + rest.slice(at + w.length);
      break;
    }
  }
  return found.sort((a, b) => a.at - b.at).map((r) => r.preset);
}

function categoryIn(f: string, categories: readonly string[]): string | undefined {
  return categories
    .filter((name) => foldWords(name).trim().length >= 3 && f.includes(foldWords(name)))
    .sort((a, b) => b.length - a.length)[0];
}

/** The place after "at" / "ở" / "tại", up to three words and never a span word. */
function merchantIn(question: string): string | undefined {
  const match = AT.exec(foldWords(question));
  if (match?.[1] === undefined) return undefined;
  const kept: string[] = [];
  for (const word of match[1].trim().split(' ')) {
    if (STOP.has(word)) break;
    kept.push(word);
  }
  if (kept.length === 0) return undefined;
  // Give back the words as the user wrote them, accents and all, when they can be found.
  const original = question
    .split(/\s+/)
    .filter((w) => kept.includes(foldWords(w).trim()))
    .join(' ');
  return original === '' ? kept.join(' ') : original.replace(/[?.!,]+$/, '');
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

export function readQuery(
  question: string,
  names: { readonly pots?: readonly string[]; readonly categories?: readonly string[] } = {},
): AskQuery {
  const f = foldWords(question);
  const pots = names.pots ?? [];
  const spoken = f.trim().split(' ');

  if (spoken.length <= 4 && has(f, CHAT) && parseAmount(question) === null) return { kind: 'chat' };
  // Pots, the weekend, saving and "can I" questions keep their original reading.
  const legacy = readIntent(question, pots);
  if (legacy.kind === 'potFull' || legacy.kind === 'weekend' || legacy.kind === 'saveMore')
    return legacy;
  if (has(f, CAN)) return legacy;
  if (has(f, BILLS) && !has(f, PAST) && parseAmount(question) === null) return { kind: 'bills' };
  if (has(f, HOW)) return { kind: 'howAmIDoing' };

  const ranges = rangesIn(f);
  const category = categoryIn(f, names.categories ?? []);
  const merchant = merchantIn(question);
  const filters = {
    ...(category === undefined ? {} : { category }),
    ...(merchant === undefined ? {} : { merchant }),
  };

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
  return legacy;
}
