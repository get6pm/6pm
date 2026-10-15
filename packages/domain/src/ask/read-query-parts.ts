import { foldWords } from '../capture/spoken-spend';
import { VND, type Currency } from '../money/currency';
import { parseAmount } from '../money/parse-amount';
import type { AskRangePreset } from './ask-query';
import {
  GOAL_FILLER,
  GOAL_GET,
  OVER,
  POT_GENERIC,
  RANGE_WORDS,
  STOP,
  has,
} from './read-query-words';

/** The pieces of a question the rules reader picks out: spans, names, a goal, a floor. */

/** A number or a money unit on its own, as folded text splits "500 tr". */
const PRICE_WORD = /^(\d.*|k|tr|trieu|cu|ty|ti|bn|nghin|ngan)$/;

/** English articles a goal keeps in front of its thing. */
const ARTICLES = new Set(['a', 'an', 'the', 'my', 'our']);

const AT = /(?:^| )(?:at|o|tai)( [a-z0-9]+(?: [a-z0-9]+){0,2})/;

export function rangesIn(f: string): AskRangePreset[] {
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

/** The longest of `names` that the question says, as a whole word or words. */
function longestNamed(f: string, names: readonly string[]): string | undefined {
  return names
    .filter((name) => foldWords(name).trim().length >= 3 && f.includes(foldWords(name)))
    .sort((a, b) => b.length - a.length)[0];
}

export function categoryIn(f: string, categories: readonly string[]): string | undefined {
  return longestNamed(f, categories);
}

/** The words as the user wrote them, accents and all, for folded words found in the question. */
function asWritten(question: string, kept: readonly string[]): string {
  const original = question
    .split(/\s+/)
    .filter((w) => kept.includes(foldWords(w).trim()))
    .join(' ');
  return original === '' ? kept.join(' ') : original.replace(/[?.!,]+$/, '');
}

/**
 * The place a question names: one of the user's own places when it says one ("Grab"), otherwise
 * the words after "at" / "ở" / "tại", up to three and never a span word.
 */
export function merchantIn(
  question: string,
  f: string,
  merchants: readonly string[],
): string | undefined {
  const known = longestNamed(f, merchants) ?? knownByPrefix(f, merchants);
  if (known !== undefined) return known;
  const match = AT.exec(f);
  if (match?.[1] === undefined) return undefined;
  const kept: string[] = [];
  for (const word of match[1].trim().split(' ')) {
    if (STOP.has(word)) break;
    kept.push(word);
  }
  return kept.length === 0 ? undefined : asWritten(question, kept);
}

/** One of the user's places typed short ("highland" for "Highlands"), five letters or more. */
function knownByPrefix(f: string, merchants: readonly string[]): string | undefined {
  const typed = f
    .trim()
    .split(' ')
    .filter((w) => w.length >= 5);
  return merchants.find((name) => {
    const first = foldWords(name).trim().split(' ')[0] ?? '';
    return typed.some((w) => first.startsWith(w));
  });
}

/** Numbers that count something else: "3 tháng", "1 ly", "tháng 4", "0%", "50/30/20". */
const NOT_MONEY = [
  /\d+\s*(?:tháng|thang|ngày|ngay|tuần|tuan|năm|nam|lần|lan|ly|cái|cai|giờ|gio|months?|days?|weeks?|years?|times|%)(?!\p{L})/giu,
  /(?:tháng|thang|month)\s*\d+/giu,
  /\d+(?:\/\d+)+/g,
];

/** The amount a question names, once numbers of days, months, cups and shares are left out. */
export function moneyIn(question: string, currency: Currency = VND): number | null {
  const money = NOT_MONEY.reduce((text, pattern) => text.replace(pattern, ' '), question);
  return parseAmount(money, currency);
}

/** The pot a question means by a telling word of its name ("nhà" for "Mua nhà"). */
export function potIn(f: string, pots: readonly string[]): string | undefined {
  return pots.find((pot) => {
    const telling = foldWords(pot)
      .trim()
      .split(' ')
      .filter((w) => w.length >= 2 && !POT_GENERIC.has(w));
    return telling.length > 0 && telling.every((w) => f.includes(` ${w} `));
  });
}

/** What a goal is for: up to three words after its verb ("mua được nhà" → "nhà"). */
export function goalWhatIn(question: string, f: string): string | undefined {
  const verb = GOAL_GET.filter((w) => f.includes(w)).sort((a, b) => f.indexOf(a) - f.indexOf(b))[0];
  if (verb === undefined) return undefined;
  const after = f
    .slice(f.indexOf(verb) + verb.length)
    .trim()
    .split(' ');
  const kept: string[] = [];
  let article: string | undefined;
  for (const word of after) {
    if (kept.length === 0 && ARTICLES.has(word)) {
      article = word;
      continue;
    }
    // Fillers and a price may come before the thing: "mua được nhà", "a 500tr car".
    if (kept.length === 0 && (GOAL_FILLER.has(word) || PRICE_WORD.test(word))) continue;
    if (word === '' || STOP.has(word) || /\d/.test(word) || has(` ${word} `, GOAL_GET)) break;
    kept.push(word);
    if (kept.length === 3) break;
  }
  if (kept.length === 0) return undefined;
  // English keeps its article, so an answer reads "for a car".
  const thing = asWritten(question, kept);
  return article === undefined ? thing : `${article} ${thing}`;
}

/** The smallest amount a list keeps ("over 500k", "trên 1tr5"). */
export function overIn(question: string, currency: Currency = VND): number | undefined {
  const match = OVER.exec(question.toLowerCase().normalize('NFC'));
  if (match?.[1] === undefined) return undefined;
  return parseAmount(match[1], currency) ?? undefined;
}
