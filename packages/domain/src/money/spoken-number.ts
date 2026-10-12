import type { Vnd } from './format';
import { parseAmount } from './parse-amount';
import { readPrintedNumber } from '../capture/wallet-amount';

/** A number said in words (or dictated as digits) inside a sentence. */
export interface SpokenNumber {
  /** What was said: "forty-five k" is 45000, "bốn lăm" is 45, "one point two million" 1200000. */
  readonly value: number;
  /** True when a unit was said ("k", "nghìn", "triệu", "million"): the value is in đồng. */
  readonly scaled: boolean;
  /** Where it sits in the NFC form of the text, end exclusive. */
  readonly start: number;
  readonly end: number;
}

type Kind = 'digit' | 'tens' | 'teen' | 'linh' | 'hundred' | 'scale' | 'half' | 'point' | 'numeral';

/** "a b c" read as {a: first, b: first + step, …}. */
function counting(words: string, first: number, step = 1): Readonly<Record<string, number>> {
  return Object.fromEntries(words.split(' ').map((word, i) => [word, first + i * step]));
}
/** "k=1e3 tr=1e6" read as {k: 1000, tr: 1000000}. */
function valued(pairs: string): Readonly<Record<string, number>> {
  return Object.fromEntries(
    pairs.split(' ').map((pair): [string, number] => {
      const [word = '', value = ''] = pair.split('=');
      return [word, Number(value)];
    }),
  );
}

const VI_DIGITS: Readonly<Record<string, number>> = {
  ...counting('một hai ba bốn năm sáu bảy tám chín', 1),
  bẩy: 7,
};
/** Unit words that only follow another number: "hai mươi mốt", "bốn lăm", "trăm tư". */
const VI_TAILS = valued('mốt=1 tư=4 lăm=5 nhăm=5');
const EN_DIGITS = counting('zero one two three four five six seven eight nine', 0);
const EN_TEENS = counting(
  'ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen',
  10,
);
const EN_TENS: Readonly<Record<string, number>> = {
  ...counting('twenty thirty forty fifty sixty seventy eighty ninety', 20, 10),
  fourty: 40,
};
/** Units that can start a number on their own ("triệu rưỡi" is 1.500.000). */
const FULL_SCALES = valued('nghìn=1e3 ngàn=1e3 triệu=1e6 tỷ=1e9 tỉ=1e9');
/** Units that need a number before them: "45k", "forty thousand", "1tr2". */
const TAIL_SCALES = valued(
  'k=1e3 nghin=1e3 ngan=1e3 thousand=1e3 thousands=1e3 tr=1e6 trieu=1e6 củ=1e6 m=1e6 mil=1e6 ' +
    'million=1e6 millions=1e6 billion=1e9 billions=1e9',
);
const HUNDREDS = new Set(['trăm', 'tram', 'hundred', 'hundreds']);
const HALVES = new Set(['rưỡi', 'ruoi', 'half']);
const POINTS = new Set(['point', 'phẩy']);

interface Token {
  readonly word: string;
  readonly start: number;
  readonly end: number;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\d+(?:[.,]\d+)*|[\p{L}\p{M}]+|\S/gu;
  for (let m = pattern.exec(text); m !== null; m = pattern.exec(text)) {
    tokens.push({ word: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

const isNumeral = (word: string) => /^\d/.test(word);
const scaleOf = (word: string) => FULL_SCALES[word] ?? TAIL_SCALES[word];
const digitOf = (word: string) => VI_DIGITS[word] ?? VI_TAILS[word] ?? EN_DIGITS[word];
const isVietnameseDigit = (word: string) => word in VI_DIGITS || word in VI_TAILS;

/** A word that carries on a number already being said. */
function continues(word: string | undefined): boolean {
  if (word === undefined) return false;
  return (
    isNumeral(word) ||
    digitOf(word) !== undefined ||
    word in EN_TEENS ||
    word in EN_TENS ||
    scaleOf(word) !== undefined ||
    HUNDREDS.has(word) ||
    HALVES.has(word) ||
    ['mươi', 'mười', 'chục', 'linh', 'lẻ'].includes(word)
  );
}

class Reading {
  total = 0;
  hundreds = 0;
  small = 0;
  fraction: string | null = null;
  last: Kind | null = null;
  lastScale = 1;
  scaled = false;
  zeroHundreds = false;
  start: number;
  end: number;

  constructor(token: Token) {
    this.start = token.start;
    this.end = token.start;
  }

  group(): number {
    const fraction = this.fraction ? Number(`0.${this.fraction}`) : 0;
    return this.hundreds + this.small + fraction;
  }

  value(): number {
    return this.total + this.group();
  }

  applyScale(scale: number): void {
    const group = this.last === null || this.last === 'scale' ? 1 : this.group();
    this.total =
      this.total > 0 && this.total < scale
        ? (this.total + group) * scale
        : this.total + group * scale;
    this.hundreds = 0;
    this.small = 0;
    this.fraction = null;
    this.lastScale = scale;
    this.scaled = true;
    this.last = 'scale';
  }

  /**
   * Takes the next word when it belongs to this number. Vietnamese drops the place of a trailing
   * digit: "hai trăm tư" is 240, "một triệu hai" 1.200.000, "bốn lăm" 45.
   */
  take(token: Token, next: string | undefined, afterNext: string | undefined): boolean {
    const { word } = token;
    const last = this.last;
    const valueEnded = last === 'digit' || last === 'tens' || last === 'teen' || last === 'numeral';
    if (this.fraction !== null && (isNumeral(word) || digitOf(word) !== undefined)) {
      this.fraction += isNumeral(word) ? word.replace(/\D/g, '') : String(digitOf(word));
      return this.took(token, 'point');
    }
    const digit = digitOf(word);
    if (digit !== undefined) {
      if (word in VI_TAILS && last === null) return false;
      const vi = isVietnameseDigit(word);
      if (last === 'digit' && this.small < 10) this.small = this.small * 10 + digit;
      else if (last === 'tens' || last === 'linh') this.small += digit;
      else if (last === 'hundred') this.small = vi && next !== 'mươi' ? digit * 10 : digit;
      else if (last === 'scale' && vi && !continues(next))
        this.total += (digit * this.lastScale) / 10;
      else if (valueEnded) return false;
      else this.small = digit;
      return this.took(token, 'digit');
    }
    if (word === 'không') {
      if (next !== 'trăm') return false;
      this.zeroHundreds = true;
      return this.took(token, 'digit');
    }
    if (isNumeral(word)) {
      if (valueEnded) return false;
      const value = readPrintedNumber(word);
      if (value === null) return false;
      const places = word.replace(/\D/g, '').length;
      if (last === 'scale' && !continues(next) && places <= 3 && Number.isInteger(value)) {
        this.total += (value * this.lastScale) / 10 ** places;
      } else this.small += value;
      return this.took(token, 'numeral');
    }
    if (word === 'mươi' || word === 'chục') {
      if (word === 'mươi' && last !== 'digit') return false;
      this.small = (this.small || 1) * 10;
      return this.took(token, 'tens');
    }
    if (word === 'mười' || word in EN_TENS || word in EN_TEENS) {
      if (valueEnded) return false;
      this.small += word === 'mười' ? 10 : (EN_TENS[word] ?? EN_TEENS[word] ?? 0);
      return this.took(token, word in EN_TEENS ? 'teen' : 'tens');
    }
    if (word === 'linh' || word === 'lẻ') {
      return last === 'hundred' && digitOf(next ?? '') !== undefined && this.took(token, 'linh');
    }
    if (HUNDREDS.has(word)) {
      this.hundreds += this.zeroHundreds ? 0 : (this.small || 1) * 100;
      this.small = 0;
      this.zeroHundreds = false;
      return this.took(token, 'hundred');
    }
    const scale = scaleOf(word);
    if (scale !== undefined) {
      if (word in TAIL_SCALES && (last === null || last === 'scale')) return false;
      this.applyScale(scale);
      return this.took(token, 'scale');
    }
    if (HALVES.has(word)) {
      if (last === 'hundred') this.small += 50;
      else if (last === 'scale') this.total += this.lastScale / 2;
      else if (last === null) {
        if (next !== 'a' || scaleOf(afterNext ?? '') === undefined) return false;
        this.small = 0.5;
      } else this.small += 0.5;
      return this.took(token, 'half');
    }
    if (POINTS.has(word)) {
      if (!valueEnded || !(isNumeral(next ?? '') || digitOf(next ?? '') !== undefined))
        return false;
      this.fraction = '';
      return this.took(token, 'point', false);
    }
    // Joining words stay inside only when a number goes on after them.
    if (word === 'a' || word === 'an') {
      if (last === 'half') return this.took(token, 'half', false);
      if (HALVES.has(next ?? '') && last !== null) return this.took(token, last, false);
      if (last !== null || !(HUNDREDS.has(next ?? '') || scaleOf(next ?? '') !== undefined)) {
        return false;
      }
      this.small = 1;
      return this.took(token, 'digit');
    }
    if ((word === 'and' || word === 'và' || word === '-') && last !== null) {
      const goesOn =
        continues(next) || ((next === 'a' || next === 'an') && HALVES.has(afterNext ?? ''));
      return goesOn && this.took(token, last, false);
    }
    return false;
  }

  private took(token: Token, kind: Kind, extend = true): true {
    this.last = kind;
    if (extend) this.end = token.end;
    return true;
  }
}

/**
 * Every number said in a sentence, in English or Vietnamese words or as dictated digits: "forty-five
 * k", "one point two million", "bốn mươi lăm nghìn", "bốn lăm k", "một triệu hai", "hai trăm
 * rưỡi", "45.000". Words that only look like numbers on their own ("a", "and", "không") count only
 * inside one.
 */
export function readSpokenNumbers(text: string): SpokenNumber[] {
  const tokens = tokenize(text.normalize('NFC'));
  const found: SpokenNumber[] = [];
  let reading: Reading | null = null;
  const finish = () => {
    if (reading && reading.end > reading.start) {
      found.push({
        value: reading.value(),
        scaled: reading.scaled,
        start: reading.start,
        end: reading.end,
      });
    }
    reading = null;
  };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] as Token;
    const next = tokens[i + 1]?.word;
    const afterNext = tokens[i + 2]?.word;
    if (reading?.take(token, next, afterNext)) continue;
    finish();
    const fresh = new Reading(token);
    if (fresh.take(token, next, afterNext)) reading = fresh;
  }
  finish();
  return found;
}

/**
 * The amount a spoken number stands for. With a unit it is exact; without one it reads as typed
 * ("forty-five" is 45.000, like "45" on the keypad), through `parseAmount`.
 */
export function spokenAmount(spoken: SpokenNumber): Vnd | null {
  const amount = spoken.scaled ? Math.round(spoken.value) : parseAmount(String(spoken.value));
  return amount !== null && amount > 0 && Number.isSafeInteger(amount) ? amount : null;
}

/** The text with each spoken number written in digits: "bốn lăm k" → "45000". */
export function spokenToDigits(text: string): string {
  const s = text.normalize('NFC');
  let out = '';
  let at = 0;
  for (const spoken of readSpokenNumbers(s)) {
    const value = spoken.scaled ? Math.round(spoken.value) : spoken.value;
    out += s.slice(at, spoken.start) + String(value);
    at = spoken.end;
  }
  return out + s.slice(at);
}
