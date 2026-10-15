import { readPrintedNumber } from '../capture/wallet-amount';
import type { AmountParts, ShareCard, ShareCurrency } from '../contracts/surfaces';
import { currencyOf, type Currency, type Money } from '../money/currency';
import { parseAmount } from '../money/parse-amount';
import { travelCurrency } from '../travel/currencies';
import { DECIMAL_PATTERN } from '../travel/fx';
import { foreignToHome } from '../travel/home-fx';
import { decimalsIn, decimalsOf, homeParts, type ContextMoney } from './context-money';

export { decimalsOf } from './context-money';

function symbolOf(currency: string): string {
  return travelCurrency(currency)?.symbol ?? currencyOf(currency).symbol;
}

export function currencyOption(money: ContextMoney, code: string): ShareCurrency {
  return { code, label: `${symbolOf(code)} · ${code}`, rate: money.rate(code) };
}

/**
 * A decimal string rounded to the currency's decimals: "68.80" for 68.8 in SGD. With `home`, the
 * home currency is written with its own decimals.
 */
export function toDecimal(value: number, currency: string, home?: Currency): string | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const fixed = value.toFixed(home ? decimalsIn(currency, home) : decimalsOf(currency));
  return DECIMAL_PATTERN.test(fixed) && Number(fixed) > 0 ? fixed : null;
}

/** A printed total taken as the home currency; null when it has decimals home never has. */
export function homeMinorOf(printed: string | null, home: Currency): Money | null {
  if (printed === null) return null;
  if (home.minorDigits === 0 && printed.includes('.')) return null;
  const amount = foreignToHome(printed, '1', home);
  return amount !== null && amount > 0 ? amount : null;
}

/** What the card and its inbox item say once the edits are applied. */
export interface ShareAmount {
  /** In the home currency; null while unread, or a foreign amount without a rate. */
  readonly amount: Money | null;
  readonly foreign: { currency: string; amount: string; rate: string | null } | null;
  readonly amountText: string;
  readonly amountParts: AmountParts;
  readonly inHomeText: string | null;
  readonly decimalEntry: boolean;
}

/** An amount typed in a foreign currency: "68,80", "68.8", "935.550". */
function typedForeign(text: string, currency: string): string | null {
  const digits = /\d(?:[\d.,\s]*\d)?/.exec(text)?.[0];
  const value = digits === undefined ? null : readPrintedNumber(digits);
  return value === null ? null : toDecimal(value, currency);
}

/**
 * The card's amount in the currency chosen: as read, or as typed in Edit. In the home currency it
 * is read like Quick add reads it ("45" is 45.000₫ in Vietnam, $45 in the US); in another
 * currency as printed, priced at the app's rate when there is one.
 */
export function shareAmount(
  card: ShareCard,
  edits: { readonly amountText?: string | undefined; readonly currency?: string | undefined },
  money: ContextMoney,
): ShareAmount {
  const { home, format } = money;
  const typed = edits.amountText !== undefined && edits.amountText.trim() !== '';
  const currency = edits.currency ?? card.currency ?? home.code;
  if (currency === home.code) {
    const read = card.currency === home.code ? card.amount : homeMinorOf(card.printed, home);
    const amount = typed ? parseAmount(edits.amountText ?? '', home) : read;
    const usable = amount !== null && amount > 0 ? amount : null;
    return {
      amount: usable,
      foreign: null,
      amountText: usable === null ? '' : format.full(usable),
      amountParts: homeParts(format, usable),
      inHomeText: null,
      decimalEntry: home.minorDigits > 0,
    };
  }
  const value = typed ? typedForeign(edits.amountText ?? '', currency) : card.printed;
  const listed = card.currencies.find((c) => c.code === currency)?.rate;
  const rate = listed ?? (card.foreign?.currency === currency ? card.foreign.rate : null);
  const inHome = value !== null && rate !== null ? foreignToHome(value, rate, home) : null;
  const priced = inHome !== null && inHome > 0 ? inHome : null;
  const text = value === null ? '' : money.foreignText(value, currency);
  return {
    amount: priced,
    foreign: value === null ? null : { currency, amount: value, rate },
    amountText: text,
    amountParts: { prefix: '', number: text, suffix: '' },
    inHomeText: priced === null ? null : format.full(priced),
    decimalEntry: decimalsOf(currency) > 0,
  };
}
