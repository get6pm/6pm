import type { AmountParts, SurfaceContext } from '../contracts/surfaces';
import { currencyOf, VND, type Currency, type Money } from '../money/currency';
import { groupDigits } from '../money/format';
import {
  moneyFormat,
  moneyLocale,
  type MoneyFormat,
  type PhoneNumberStyle,
} from '../money/money-format';
import { travelCurrency } from '../travel/currencies';
import { formatForeign, isRate } from '../travel/fx';
import { foreignToHome, homeRate } from '../travel/home-fx';

/**
 * Money as an extension writes it, from what the app last left in the context: the home
 * currency (đồng when the context names none, or there is no context), the phone's number style
 * and the app's rates.
 */
export interface ContextMoney {
  readonly home: Currency;
  /** The home currency in the app's language and the phone's number style. */
  readonly format: MoneyFormat;
  /** Home units for one unit of `code` at the app's last rates; null without one. */
  rate(code: string): string | null;
  /** A foreign amount (an exact decimal in its own units) as the card prints it: "S$68,80". */
  foreignText(amount: string, code: string): string;
  /** The same amount as the Edit field opens on it: "68,80". */
  foreignEditText(amount: string, code: string): string;
}

/** Decimals a foreign currency's prices are written with: đồng and Travel's whole ones none. */
export function decimalsOf(currency: string): 0 | 2 {
  if (currency === 'VND') return 0;
  return travelCurrency(currency)?.decimals ?? 2;
}

/** Decimals an amount in `code` is written with, when home is `home`. */
export function decimalsIn(code: string, home: Currency): number {
  return code === home.code ? home.minorDigits : decimalsOf(code);
}

/** "S$68,80", "Rp935.550", or "68.80 CHF" for a currency 6pm has no symbol for (the đồng way). */
function dongWayText(amount: string, currency: string): string {
  const known = travelCurrency(currency);
  if (!known) return `${amount} ${currency}`;
  return formatForeign(Math.round(Number(amount) * 10 ** known.decimals), known);
}

/** "120.000" in đồng, "68,80" abroad, as a phone counting đồng types them. */
function dongWayEdit(amount: string, currency: string): string {
  if (decimalsOf(currency) === 0) return groupDigits(Math.round(Number(amount)));
  const [whole = '0', cents = ''] = amount.split('.');
  return `${groupDigits(Number(whole))}${cents === '' ? '' : `,${cents}`}`;
}

/** A foreign currency as a phone counting another one writes it: Travel's symbol and decimals. */
function foreignCurrency(code: string): Currency {
  const own = currencyOf(code);
  const decimals = decimalsOf(code);
  const symbol = travelCurrency(code)?.symbol ?? own.symbol;
  return { ...own, symbol, minorDigits: decimals, minorPerMajor: 10 ** decimals };
}

/** How the phone writes money: the home currency, the app's language and the number style. */
export interface WritingStyle {
  readonly home: Currency;
  readonly language: 'en' | 'vi';
  readonly phone?: PhoneNumberStyle;
}

/**
 * A foreign amount (an exact decimal in its own units) as 6pm prints it. A phone counting đồng
 * writes it the đồng way ("S$68,80"); any other phone in its own number style ("S$68.80").
 * `edit` gives the number alone, as the Edit field opens on it.
 */
export function writeForeign(
  amount: string,
  code: string,
  style: WritingStyle,
  edit = false,
): string {
  if (style.home.code === 'VND') {
    return edit ? dongWayEdit(amount, code) : dongWayText(amount, code);
  }
  const currency = code === 'VND' ? VND : foreignCurrency(code);
  const format = moneyFormat(moneyLocale(currency, style.language, style.phone ?? {}));
  const minor = foreignToHome(amount, '1', currency) ?? 0;
  if (edit) return format.number(minor);
  const parts = format.parts(minor);
  // A sign that ends in a mark ("S$", "CN¥") is set close, as it is printed.
  const prefix = /\P{L}$/u.test(currency.symbol) ? parts.prefix.trimEnd() : parts.prefix;
  return parts.sign + prefix + parts.number + parts.suffix;
}

export function contextMoney(context: SurfaceContext | null): ContextMoney {
  const home = context?.currency ? currencyOf(context.currency) : VND;
  const { languageTag = null, decimal = null, group = null } = context?.numberStyle ?? {};
  const style: WritingStyle = {
    home,
    language: context?.language ?? 'en',
    phone: { languageTag, decimal, group },
  };
  const format = moneyFormat(moneyLocale(home, style.language, style.phone));
  const quote = (code: string) => {
    const rate = context?.rates?.find((r) => r.currency === code)?.rate;
    return rate !== undefined && isRate(rate) ? rate : null;
  };
  return {
    home,
    format,
    rate: (code) => {
      if (code === home.code) return null;
      // Đồng is what the server quotes in: the quote is the rate.
      if (home.code === 'VND') return quote(code);
      return homeRate(code, home, quote);
    },
    foreignText: (amount, code) => writeForeign(amount, code, style),
    foreignEditText: (amount, code) => writeForeign(amount, code, style, true),
  };
}

/** What the Edit field opens on for an amount in the home currency: "120.000", "1,234.50". */
export function homeEditText(money: ContextMoney, amount: Money): string {
  return money.home.code === 'VND' ? groupDigits(amount) : money.format.number(amount);
}

/** A home amount in pieces, the symbol trimmed; all empty when there is none. */
export function homeParts(format: MoneyFormat, amount: Money | null): AmountParts {
  if (amount === null) return { prefix: '', number: '', suffix: '' };
  const parts = format.parts(amount);
  return {
    prefix: (parts.sign + parts.prefix).trim(),
    number: parts.number,
    suffix: parts.suffix.trim(),
  };
}
