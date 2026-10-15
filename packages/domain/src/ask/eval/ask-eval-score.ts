import { foldWords } from '../../capture/spoken-spend';
import type { AskQuery } from '../ask-query';

/**
 * The evaluation set for reading Ask questions: real phrasings, each with the reading it should
 * get. It scores any reader (the rules, the server's model, the phone's model) the same way.
 */

/** A reading as wanted: its kind and only the fields that matter (a list "at WinMart", any span). */
export interface WantedQuery {
  readonly kind: AskQuery['kind'];
  readonly [field: string]: unknown;
}

/** What a reader should say. `gap`: nothing is designed for it yet, so it should say unknown. */
export type EvalWant = WantedQuery | readonly WantedQuery[] | 'gap';

export interface EvalCase {
  readonly question: string;
  /** The research category: A lookups … V corrections, S actions. */
  readonly group: string;
  readonly want: EvalWant;
}

/** The day, names and places every case is read with. */
export const EVAL_TODAY = '2026-10-15';
export const EVAL_NAMES = {
  vi: {
    categories: ['Ăn uống', 'Cà phê', 'Đi lại', 'Mua sắm', 'Trà sữa', 'Ăn ngoài'],
    pots: ['Đà Lạt', 'Tết', 'Nhật Bản'],
    merchants: ['Highlands', 'Grab', 'Shopee', 'WinMart', 'Circle K'],
  },
  en: {
    categories: ['Food', 'Coffee', 'Transport', 'Shopping', 'Eating out'],
    pots: ['Japan', 'Emergency'],
    merchants: ['Starbucks', 'Grab', 'Shopee', 'Circle K'],
  },
} as const;

export type EvalVerdict = 'right' | 'wrong' | 'unknown';

/** A name as the phone matches it: no accents, case or English article, and short forms count. */
const plain = (name: string) =>
  foldWords(name)
    .replace(/^ (a|an|the|my) /, ' ')
    .trim();

const same = (a: unknown, b: unknown): boolean =>
  typeof a === 'string' && typeof b === 'string'
    ? plain(a) === plain(b) || (plain(a).length >= 5 && plain(b).startsWith(plain(a)))
    : JSON.stringify(a) === JSON.stringify(b);

/** Every field the wanted reading names matches (names without accents or case). */
function matches(got: AskQuery, want: WantedQuery): boolean {
  if (got.kind !== want.kind) return false;
  const g = got as Readonly<Record<string, unknown>>;
  return Object.entries(want).every(([key, value]) => same(g[key], value));
}

/**
 * `right` when the reading is one of those wanted; for a gap, when it says unknown. `unknown`
 * when it did not understand a question that has an answer; `wrong` when it answered something
 * else, the worst case: a confident answer to a different question.
 */
export function scoreReading(got: AskQuery, want: EvalWant): EvalVerdict {
  const said = got.kind === 'unknown';
  if (want === 'gap') return said ? 'right' : 'wrong';
  const wanted: readonly WantedQuery[] = Array.isArray(want) ? want : [want as WantedQuery];
  if (wanted.some((w) => matches(got, w))) return 'right';
  return said ? 'unknown' : 'wrong';
}

/** The case's language, for the names it is read with. */
export function languageOf(question: string): 'vi' | 'en' {
  const vietnamese = /[ăâđêôơưạảãằắẳẵặầấẩẫậẻẽẹềếểễệỉĩịỏõọồốổỗộờớởỡợủũụừứửữựỳỷỹỵ]/iu;
  return vietnamese.test(question) ||
    /\b(minh|bao nhieu|thang nay|tuan nay|xai|tien)\b/.test(question)
    ? 'vi'
    : 'en';
}
