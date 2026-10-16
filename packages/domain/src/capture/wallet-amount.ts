import { currencyOf, VND, type Currency } from '../money/currency';
import { FX_CURRENCY_CODES, travelCurrencyOf } from '../travel/currencies';

/** An amount as a payment app printed it, in its own currency. */
export interface WalletAmount {
  /** ISO 4217, upper case: "VND", "USD". */
  readonly currency: string;
  /** Whole minor units of that currency: đồng for VND (it has none smaller), cents for USD. */
  readonly amount: number;
}

type Mark = readonly [mark: RegExp, code: string, bare?: 'bare'];

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A mark that starts or ends in a letter stands only as a whole word ("RM" never inside "FORM"). */
function markOf(text: string, flags = 'u'): RegExp {
  const before = /^\p{L}/u.test(text) ? '(?<!\\p{L})' : '';
  const after = /\p{L}$/u.test(text) ? '(?!\\p{L})' : '';
  return new RegExp(before + escape(text) + after, flags);
}

/** Codes that spell an English word ("try", "pen") count only in capitals. */
const WORD_CODES = new Set(['CAD', 'GEL', 'MAD', 'PEN', 'TRY']);

/** Marks people write that neither currency table holds. */
const EXTRA_SYMBOLS: readonly (readonly [string, string])[] = [
  ['US$', 'USD'],
  ['C$', 'CAD'],
  ['RMB', 'CNY'],
];

/** Symbols several currencies write: the home currency's when home writes it so, else these. */
const BARE_SYMBOLS: readonly (readonly [string, string])[] = [
  ['$', 'USD'],
  ['¥', 'JPY'],
  ['£', 'GBP'],
];

/**
 * Symbols and codes as payment apps print them: every code 6pm knows and every symbol that names
 * one currency ("NT$", "HK$", "CN¥", "RM", "Rp", "₱"), longest first so "US$" wins over "$". A
 * symbol several currencies share ("kr", "Rs") or a single letter ("R", "K") is no mark; a bare
 * $, ¥ or £ comes last.
 */
function buildMarks(): readonly Mark[] {
  const codes = ['VND', ...FX_CURRENCY_CODES];
  const bare = new Set(BARE_SYMBOLS.map(([symbol]) => symbol));
  const owners = new Map<string, Set<string>>();
  const own = (symbol: string, code: string) => {
    owners.set(symbol, (owners.get(symbol) ?? new Set<string>()).add(code));
  };
  for (const code of codes) {
    own(currencyOf(code).symbol, code);
    own(travelCurrencyOf(code)?.symbol ?? code, code);
  }
  for (const [symbol, code] of EXTRA_SYMBOLS) own(symbol, code);
  const written: (readonly [text: string, mark: Mark])[] = codes.map((code) => [
    code,
    [markOf(code, WORD_CODES.has(code) ? 'u' : 'iu'), code],
  ]);
  for (const [symbol, held] of owners) {
    const [code] = held;
    if (code === undefined || held.size > 1 || bare.has(symbol) || codes.includes(symbol)) continue;
    if (/^\p{L}$/u.test(symbol)) continue;
    written.push([symbol, [markOf(symbol), code]]);
  }
  written.sort(([a], [b]) => b.length - a.length);
  return [
    [/vnđ|₫|đồng|\d\s?đ(?!\p{L})/iu, 'VND'],
    ...written.map(([, mark]) => mark),
    ...BARE_SYMBOLS.map(([symbol, code]): Mark => [markOf(symbol), code, 'bare']),
  ];
}

const CURRENCY_MARKS = buildMarks();

/** A letter or currency sign set right against the digits, when no mark names a currency. */
const UNNAMED_MARK = /[\p{L}\p{Sc}]\d|\d[\p{L}\p{Sc}]/u;

/** The currency an amount is printed in: its mark, else home; null for a mark 6pm cannot name. */
function currencyIn(text: string, home: Currency): string | null {
  if (home.code !== 'VND' && markOf(home.code, 'iu').test(text)) return home.code;
  const found = CURRENCY_MARKS.find(([mark]) => mark.test(text));
  if (!found) return UNNAMED_MARK.test(text) ? null : home.code;
  const [, code, bare] = found;
  return bare && currencyOf(code).symbol === home.symbol ? home.code : code;
}

/**
 * Reads the amount a payment app hands over, such as the Wallet automation's "Amount":
 * "₫45,000", "45.000 ₫", "VND 45,000.00", "45000", "$3.50". With no currency mark it is in the
 * home currency, taken as written (unlike a typed amount, "45" is 45₫ in Vietnam). Returns null
 * when nothing is readable or the amount is zero: Wallet passes "0.0" or nothing when it could
 * not read the card's amount. A mark 6pm cannot name ("XYZ12") is null too, never home money.
 */
export function parseWalletAmount(text: string, home: Currency = VND): WalletAmount | null {
  const s = text.normalize('NFC').trim();
  if (s === '') return null;
  const currency = currencyIn(s, home);
  if (currency === null) return null;
  const digits = /\d(?:[\d.,'\s]*\d)?/.exec(s)?.[0];
  if (digits === undefined) return null;
  const { minorDigits, minorPerMajor } = currencyOf(currency);
  const value = readPrintedNumber(digits, minorDigits);
  if (value === null || value <= 0) return null;
  const amount = Math.round(value * minorPerMajor);
  return amount > 0 && Number.isSafeInteger(amount) ? { currency, amount } : null;
}

/**
 * A printed number with either convention: "45,000.00" and "45.000,00" are both 45000. When only
 * one kind of separator appears, it groups thousands if every group after it has three digits
 * ("45.000", "1,250,000"), and is a decimal point otherwise ("3.50", "0.0"). A first group of 0
 * is never thousands ("0.500" is a half), and in a currency counted in thousandths (`minorDigits`
 * 3, the dinars) one lone separator before three digits is a decimal point ("1.250" KD).
 */
export function readPrintedNumber(raw: string, minorDigits = 2): number | null {
  const s = raw.replace(/[\s']/g, '');
  if (!/^\d[\d.,]*$/.test(s) || /[.,]$/.test(s)) return null;
  const decimalAt = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  if (decimalAt < 0) return Number(s);
  const mixed = s.includes('.') && s.includes(',');
  const groups = s.split(/[.,]/);
  const first = groups[0] ?? '';
  const thousandths = minorDigits === 3 && groups.length === 2;
  const grouped =
    first.length <= 3 &&
    !first.startsWith('0') &&
    !thousandths &&
    groups.slice(1).every((group) => group.length === 3);
  if (!mixed && grouped) return Number(groups.join(''));
  if (!mixed && groups.length > 2) return null;
  const integer = s.slice(0, decimalAt).replace(/[.,]/g, '');
  return Number(`${integer}.${s.slice(decimalAt + 1)}`);
}
