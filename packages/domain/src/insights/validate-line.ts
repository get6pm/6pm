/**
 * Checks a line a model wrote before the phone shows it. A model never writes a number: it writes
 * placeholders (`{spent}`) that the phone fills from facts it computed. A line that fails any rule
 * is dropped and the next wording tier answers, so a bad line is never shown.
 */

export type LineLanguage = 'en' | 'vi';

export type LineSurface = 'bubble' | 'toast' | 'note' | 'notification' | 'answer';

/** Longest line per surface, counted before placeholders are filled. */
export const LINE_MAX_LENGTH: Readonly<Record<LineSurface, number>> = {
  bubble: 140,
  toast: 90,
  note: 160,
  notification: 120,
  answer: 400,
};

export type LineProblem =
  | 'empty'
  | 'tooLong'
  | 'digit'
  | 'unknownPlaceholder'
  | 'missingFact'
  | 'brokenPlaceholder'
  | 'tooFewWords'
  | 'wrongLanguage'
  | 'shaming';

export type LineCheck =
  { readonly ok: true } | { readonly ok: false; readonly problem: LineProblem };

const PLACEHOLDER = /\{([A-Za-z]+)\}/g;
const WORD = /\p{L}+/gu;
/**
 * Words a line needs besides its placeholders, and it needs more words than placeholders: fewer is
 * a fragment ("{days}", "hũ") or values strung together ("mình, hũ {bill} {amount} {days} nha").
 */
export const LINE_MIN_WORDS = 3;
const DIGIT = /\p{Nd}/u;
/**
 * Letters only Vietnamese writes, of the two languages. Letters French or Spanish borrow into
 * English ("café", "piñata") are left out so an English line with a loanword still passes.
 */
const VIETNAMESE = /[ăâđêôơưạảãằắẳẵặầấẩẫậẻẽẹềếểễệỉĩịỏõọồốổỗộờớởỡợủũụừứửữựỳỷỹỵ]/iu;

/**
 * Words that put the person down rather than the habit. Matched as whole words after folding
 * case; the catalogue and every prompt are written so a good line never needs them.
 */
const SHAMING: Readonly<Record<LineLanguage, readonly string[]>> = {
  en: [
    'stupid',
    'idiot',
    'dumb',
    'lazy',
    'pathetic',
    'loser',
    'irresponsible',
    'useless',
    'hopeless',
    'shameful',
    'disgrace',
  ],
  vi: [
    'ngu',
    'đần',
    'lười',
    'vô dụng',
    'thảm hại',
    'vô trách nhiệm',
    'đồ hoang phí',
    'nhục',
    'xấu hổ',
  ],
};

function hasWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, 'iu').test(text);
}

/** The placeholders a line uses, in order, each once. */
export function placeholdersOf(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1] ?? ''))];
}

export function validateLine(
  text: string,
  options: {
    /** Each fact's slot names: a line uses only these, and at least one of each fact's. */
    readonly facts: readonly (readonly string[])[];
    readonly language: LineLanguage;
    readonly surface: LineSurface;
  },
): LineCheck {
  const line = text.trim();
  if (line === '') return { ok: false, problem: 'empty' };
  if (line.length > LINE_MAX_LENGTH[options.surface]) return { ok: false, problem: 'tooLong' };

  const used = new Set(placeholdersOf(line));
  const allowed = new Set(options.facts.flat());
  if ([...used].some((name) => !allowed.has(name))) {
    return { ok: false, problem: 'unknownPlaceholder' };
  }
  const bare = line.replace(PLACEHOLDER, '');
  if (bare.includes('{') || bare.includes('}')) return { ok: false, problem: 'brokenPlaceholder' };
  if (DIGIT.test(bare)) return { ok: false, problem: 'digit' };
  if (options.facts.some((slots) => slots.length > 0 && !slots.some((name) => used.has(name)))) {
    return { ok: false, problem: 'missingFact' };
  }
  const words = (bare.match(WORD) ?? []).length;
  if (words < LINE_MIN_WORDS || words <= used.size) return { ok: false, problem: 'tooFewWords' };

  const vietnamese = VIETNAMESE.test(bare);
  if (options.language === 'vi' ? !vietnamese : vietnamese) {
    return { ok: false, problem: 'wrongLanguage' };
  }
  if (SHAMING[options.language].some((word) => hasWord(bare, word))) {
    return { ok: false, problem: 'shaming' };
  }
  return { ok: true };
}

/** Fills a checked line's placeholders with the phone's formatted values. */
export function fillLine(text: string, values: Readonly<Record<string, string>>): string {
  return text.trim().replace(PLACEHOLDER, (whole, name: string) => values[name] ?? whole);
}
