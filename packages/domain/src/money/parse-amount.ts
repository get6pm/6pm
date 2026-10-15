import { readPrintedNumber } from '../capture/wallet-amount';
import { toMinor, VND, type Currency, type Money } from './currency';

const BILLION = /^(tỷ|tỉ|ty|ti|bn|billion|billions)$/;
const MILLION = /^(tr|triệu|trieu|củ|cu|m|mil|million|millions)$/;
const THOUSAND = /^(k|nghìn|nghin|ngàn|ngan|ng|nghìn đồng|thousand|thousands)$/;

/** Currency marks dropped before reading the number, besides the currency's own code and symbol. */
const MARKS = /₫|vnd|đồng|usd|eur|gbp|[$€£¥₩₹₱₺₦₪฿]/gu;

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Reads an amount the way people say or type it, in minor units of `currency`.
 *
 * In đồng, the Vietnamese way: "45k", "45 nghìn", "45.000", "1tr2" (1.200.000), "1,5tr",
 * "2 triệu rưỡi" (2.500.000), "3 tỷ", "1ty2" (1.200.000.000), "350". A bare small number means
 * thousands ("35" → 35.000), as the design's keypad and Ask do; a bare number of 1000 or more is
 * taken as written.
 *
 * In any other currency a bare number is taken as written, with either decimal mark ("3.50",
 * "12,50", "1,250"); k, m and bn (and their Vietnamese words) still mean thousands, millions and
 * billions. Returns null when no amount is found.
 */
export function parseAmount(text: string, currency: Currency = VND): Money | null {
  if (currency.code !== 'VND') return parseForeign(text, currency);
  const s = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/₫|đ\b|vnd|đồng/g, ' ');
  const match =
    /(\d+(?:[.,]\d+)*)\s*(?:(tỷ|tỉ|ty|ti|billions?|bn|triệu|trieu|tr|củ|cu|millions?|mil|m|nghìn|nghin|ngàn|ngan|ng|thousands?|k)(?!\p{L}))?(\d{1,3})?(?:\s*(rưỡi|ruoi)(?!\p{L}))?/u.exec(
      s,
    );
  if (!match) return null;
  const [, rawNumber = '', rawUnit, trailing, half] = match;
  const unit = rawUnit ?? '';
  const isBillion = BILLION.test(unit);
  const isMillion = MILLION.test(unit);
  const isThousand = THOUSAND.test(unit);

  let value = readNumber(rawNumber, isBillion || isMillion || isThousand);
  if (value === null) return null;

  if (isBillion) {
    value *= 1_000_000_000;
    // "1ty2" = 1.2 billion.
    if (trailing) value += Number(trailing) * 10 ** (9 - trailing.length);
  } else if (isMillion) {
    value *= 1_000_000;
    // "1tr2" = 1.2 million, "1tr25" = 1.25 million.
    if (trailing) value += Number(trailing) * 10 ** (6 - trailing.length);
  } else if (isThousand) {
    value *= 1000;
    if (trailing) value += Number(trailing) * 10 ** (3 - trailing.length);
  } else if (value < 1000) {
    value *= 1000;
  }
  // "rưỡi" is half of the unit: "2 triệu rưỡi" is 2.500.000, "45 nghìn rưỡi" is 45.500.
  if (half) value += isBillion ? 500_000_000 : isMillion ? 500_000 : 500;
  return Math.round(value);
}

/**
 * "45.000" and "1.250.000" are grouped thousands; "1.5" and "1,5" are decimals (only meaningful
 * before a unit).
 */
function readNumber(raw: string, hasUnit: boolean): number | null {
  const groups = raw.split(/[.,]/);
  if (groups.length === 1) return Number(raw);
  const grouped = groups.slice(1).every((g) => g.length === 3);
  if (grouped && !(hasUnit && groups.length === 2 && raw.includes(','))) {
    return Number(groups.join(''));
  }
  if (groups.length === 2) return Number(`${groups[0]}.${groups[1]}`);
  return null;
}

function parseForeign(text: string, currency: Currency): Money | null {
  // A symbol of letters ("kr", "Rp") goes only as a whole word; one letter ("R", "K") stays, as k
  // is also the thousands unit.
  const symbol = currency.symbol.toLowerCase();
  const word = /\p{L}/u.test(symbol);
  const marks = [`\\b${currency.code.toLowerCase()}\\b`];
  if (!word) marks.push(escape(symbol));
  else if (symbol.length > 1) marks.push(`(?<!\\p{L})${escape(symbol)}(?!\\p{L})`);
  const own = new RegExp(marks.join('|'), 'gu');
  const s = text.toLowerCase().normalize('NFC').replace(own, ' ').replace(MARKS, ' ');
  const match =
    /(\d+(?:[.,]\d+)*)\s*(?:(tỷ|tỉ|ty|ti|billions?|bn|triệu|trieu|tr|củ|cu|millions?|mil|m|nghìn|nghin|ngàn|ngan|ng|thousands?|k)(?!\p{L}))?(\d{1,3})?(?:\s*(rưỡi|ruoi)(?!\p{L}))?/u.exec(
      s,
    );
  if (!match) return null;
  const [, rawNumber = '', rawUnit, trailing, half] = match;
  const unit = rawUnit ?? '';
  const scale = BILLION.test(unit)
    ? 1_000_000_000
    : MILLION.test(unit)
      ? 1_000_000
      : THOUSAND.test(unit)
        ? 1000
        : 1;
  let value = readPrintedNumber(rawNumber);
  if (value === null || !Number.isFinite(value)) return null;
  if (scale > 1) {
    value *= scale;
    const places = Math.log10(scale);
    if (trailing) value += Number(trailing) * 10 ** (places - trailing.length);
    if (half) value += scale / 2;
  }
  const amount = toMinor(value, currency);
  return Number.isSafeInteger(amount) ? amount : null;
}
