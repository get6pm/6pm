import { VND, type Currency, type Money } from './currency';
import { formatShort, formatVnd, groupDigits, MINUS } from './format';

/** How the phone writes money: its currency, separators and where the symbol goes. */
export interface MoneyLocale {
  readonly currency: Currency;
  /** The app's language, for the short form's words ("tr" in Vietnamese). */
  readonly language: 'en' | 'vi';
  /** The decimal mark: "." or ",". */
  readonly decimal: string;
  /** The thousands separator: ",", ".", a space or an apostrophe. */
  readonly group: string;
  /** "12,50 €" rather than "€12.50". */
  readonly symbolAfter: boolean;
}

/** An amount split for drawing: the odometer rolls `number` and sets the symbol on its own. */
export interface MoneyParts {
  /** U+2212 for a negative amount, else empty. */
  readonly sign: string;
  /** The symbol and its space when it comes first ("$", "Rp "), else empty. */
  readonly prefix: string;
  /** Digits with separators: "1.250.000", "1,234.50". */
  readonly number: string;
  /** The symbol and its space when it comes last ("₫", " €"), else empty. */
  readonly suffix: string;
}

export interface MoneyFormat {
  readonly locale: MoneyLocale;
  readonly currency: Currency;
  /** Full amount with its symbol: "49.000₫", "$1,234.50", "12,50 €". */
  full(amount: Money): string;
  /** The short form for labels and companion lines: "353k", "17,4tr", "$353", "$17.4k". */
  short(amount: Money): string;
  /** `full` in pieces. */
  parts(amount: Money): MoneyParts;
  /** Digits and separators only, no sign or symbol: "49.000", "1,234.50". */
  number(amount: Money): string;
  /** What VoiceOver reads: "49.000 đồng", "$12.50". */
  spoken(amount: Money): string;
}

/** Languages that write the symbol after the amount ("12,50 €"). Brazil writes it first. */
const SYMBOL_AFTER = new Set([
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'es',
  'et',
  'fi',
  'fr',
  'hr',
  'hu',
  'is',
  'it',
  'lt',
  'lv',
  'nb',
  'nn',
  'no',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sv',
  'uk',
  'vi',
]);

export interface PhoneNumberStyle {
  /** BCP 47 tag of the phone's first locale: "en-US", "de-DE". */
  readonly languageTag?: string | null;
  readonly decimal?: string | null;
  readonly group?: string | null;
}

/** The money locale for a currency, written the way the phone writes numbers. */
export function moneyLocale(
  currency: Currency,
  language: 'en' | 'vi',
  phone: PhoneNumberStyle = {},
): MoneyLocale {
  const tag = (phone.languageTag ?? '').toLowerCase();
  const [lang = ''] = tag.split(/[-_]/);
  const decimal = phone.decimal === ',' ? ',' : '.';
  const rawGroup = phone.group ?? (decimal === ',' ? '.' : ',');
  const group = rawGroup === decimal ? (decimal === ',' ? '.' : ',') : rawGroup;
  const symbolAfter = SYMBOL_AFTER.has(lang) && tag !== 'pt-br';
  return { currency, language, decimal, group, symbolAfter };
}

/** The design's own: đồng, written the Vietnamese way in either language. */
export function vndLocale(language: 'en' | 'vi'): MoneyLocale {
  return { currency: VND, language, decimal: ',', group: '.', symbolAfter: true };
}

function grouped(whole: number, group: string): string {
  return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, group);
}

/** Digits of an amount: whole part grouped, decimals only when the amount has some. */
function digitsOf(amount: Money, locale: MoneyLocale): string {
  const { currency, decimal, group } = locale;
  const abs = Math.abs(Math.round(amount));
  const whole = Math.floor(abs / currency.minorPerMajor);
  const minor = abs % currency.minorPerMajor;
  const head = grouped(whole, group);
  if (minor === 0) return head;
  return head + decimal + minor.toString().padStart(currency.minorDigits, '0');
}

/** A symbol made of letters ("Rp", "CHF", "R$") keeps a space from the number. */
function spaced(symbol: string): boolean {
  return /\p{L}/u.test(symbol);
}

function partsOf(amount: Money, locale: MoneyLocale): MoneyParts {
  const sign = Math.round(amount) < 0 ? MINUS : '';
  const { symbol } = locale.currency;
  const number = digitsOf(amount, locale);
  if (locale.symbolAfter) return { sign, prefix: '', number, suffix: ' ' + symbol };
  return { sign, prefix: symbol + (spaced(symbol) ? ' ' : ''), number, suffix: '' };
}

function oneDecimal(value: number, decimal: string): string {
  return (Math.round(value * 10) / 10).toString().replace('.', decimal);
}

/**
 * The short form outside đồng: whole steps below ten thousand ("$353", "¥3,530"), thousands as k
 * ("$17.4k", "₩353k"), millions as M ("$1.2M"; "tr" in Vietnamese), billions as B ("$1.25B";
 * "tỷ" in Vietnamese).
 */
function shortOf(amount: Money, locale: MoneyLocale): string {
  const { currency, decimal } = locale;
  const sign = amount < 0 ? MINUS : '';
  const major = Math.abs(amount) / currency.minorPerMajor;
  const stepMajor = currency.step / currency.minorPerMajor;
  let body: string;
  if (Math.round(major / 100_000) >= 10_000) {
    const billions = (Math.round(major / 10_000_000) / 100).toString().replace('.', decimal);
    body = billions + (locale.language === 'vi' ? '\u00a0tỷ' : 'B');
  } else if (Math.round(major / 1000) >= 1000) {
    // An amount that rounds up to a thousand thousands is a million: "$1M", never "1000k".
    body = oneDecimal(major / 1_000_000, decimal) + (locale.language === 'vi' ? 'tr' : 'M');
  } else if (Math.round(major / stepMajor) * stepMajor >= 10_000) {
    const thousands = major / 1000;
    body =
      (thousands >= 100 ? Math.round(thousands).toString() : oneDecimal(thousands, decimal)) + 'k';
  } else {
    body = grouped(Math.round(major / stepMajor) * stepMajor, locale.group);
  }
  const { prefix, suffix } = partsOf(1, locale);
  return (body === '0' ? '' : sign) + prefix + body + suffix;
}

/** Writes money for one locale. VND keeps the design's exact forms in both languages. */
export function moneyFormat(locale: MoneyLocale): MoneyFormat {
  const { currency } = locale;
  if (currency.code === 'VND') {
    return {
      locale,
      currency,
      full: formatVnd,
      short: (amount) => formatShort(amount, locale.language),
      parts: (amount) => ({
        sign: Math.round(amount) < 0 ? MINUS : '',
        prefix: '',
        number: groupDigits(amount),
        suffix: '₫',
      }),
      number: groupDigits,
      spoken: (amount) => `${formatVnd(amount).slice(0, -1)} đồng`,
    };
  }
  return {
    locale,
    currency,
    full: (amount) => {
      const p = partsOf(amount, locale);
      return p.sign + p.prefix + p.number + p.suffix;
    },
    short: (amount) => shortOf(amount, locale),
    parts: (amount) => partsOf(amount, locale),
    number: (amount) => digitsOf(amount, locale),
    spoken: (amount) => {
      const p = partsOf(amount, locale);
      return p.sign + p.prefix + p.number + p.suffix;
    },
  };
}
