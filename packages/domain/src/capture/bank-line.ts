import { VND, type Currency, type Money } from '../money/currency';
import { categoryHintOf, type StarterCategoryId } from './spoken-spend';
import { readPrintedNumber } from './wallet-amount';

/** A line dragged out of a bank app: who was paid, how much, and a guess at the category. */
export interface BankLine {
  readonly merchant: string;
  /** In the home currency's minor units. */
  readonly amount: Money;
  readonly categoryHint: StarterCategoryId | null;
}

/**
 * An amount as a bank list prints it: signed, grouped or with k, maybe a currency mark. A currency
 * with cents also reads "4.50"; đồng never has a decimal part, so there it would be a misreading.
 */
function amountPattern(currency: Currency): RegExp {
  const cents = currency.minorDigits > 0 ? '|\\d+[.,]\\d{2}(?!\\d)' : '';
  return new RegExp(
    `([-−–])?\\s*(?:₫|vnd|đ)?\\s*(\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d+)?\\s*k\\b${cents}|\\d{4,})\\s*(?:₫|vnd|vnđ|đ|d\\b)?`,
    'giu',
  );
}
const TIME = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
const DATE = /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g;
/** Words a bank list puts beside a payment that are not who was paid. */
const NOISE = /\b(?:card|thẻ|debit|credit|today|hôm nay|drag)\b|[→•·|]/giu;

interface Found {
  readonly value: number;
  readonly negative: boolean;
  readonly start: number;
  readonly end: number;
}

function amounts(text: string, currency: Currency): Found[] {
  const found: Found[] = [];
  for (const m of text.matchAll(amountPattern(currency))) {
    const raw = m[2] ?? '';
    const thousands = /k$/i.test(raw.trim());
    const number = readPrintedNumber(raw.replace(/\s*k$/i, ''), currency.minorDigits);
    if (number === null || number <= 0) continue;
    const major = thousands ? number * 1000 : number;
    found.push({
      value: Math.round(major * currency.minorPerMajor),
      negative: m[1] !== undefined,
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return found;
}

/**
 * Reads a payment line dragged in from a bank app beside 6pm ("Circle K Lê Lợi · 17:41 · Card ·
 * −32.000"). The amount is the one printed with a minus, else the last one, never a time or a
 * date; the merchant is the first piece of the line with letters once the amount, times, dates and
 * card words are taken out. Null when the line holds no amount.
 */
export function parseBankLine(text: string, currency: Currency = VND): BankLine | null {
  const s = text.normalize('NFC').replace(TIME, ' ').replace(DATE, ' ');
  const found = amounts(s, currency);
  const picked = found.find((f) => f.negative) ?? found[found.length - 1];
  if (!picked) return null;
  const rest = `${s.slice(0, picked.start)}\n${s.slice(picked.end)}`;
  const pieces = rest
    .split(/[\n\r]+|\s[·•|]\s/)
    .map((piece) =>
      piece.replace(amountPattern(currency), ' ').replace(NOISE, ' ').replace(/\s+/g, ' ').trim(),
    )
    .filter((piece) => /\p{L}/u.test(piece));
  const merchant = pieces[0] ?? '';
  return { merchant, amount: picked.value, categoryHint: categoryHintOf(merchant) };
}
