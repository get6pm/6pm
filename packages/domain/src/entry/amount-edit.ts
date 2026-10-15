import { toMajor, VND, type Currency } from '../money/currency';
import { travelCurrency } from '../travel/currencies';
import { DECIMAL_PATTERN } from '../travel/fx';
import { foreignToHome } from '../travel/home-fx';
import { homeKeypad, keypadHomeMinor, pressKey, type KeypadKey, type KeypadState } from './keypad';

/**
 * A spend's amount as its row keeps it: minor units of the home currency, and the foreign amount
 * it was priced from (its rate is home units for one unit).
 */
export interface SpendAmount {
  readonly amount: number;
  readonly foreignAmount: { currency: string; amount: number; rate: number } | null;
}

function decimalsOf(currency: string): number {
  return travelCurrency(currency)?.decimals ?? 2;
}

/** A number as the keypad holds it: "68.8", "496650", never an exponent. */
function digitsOf(value: number, decimals: number): string {
  if (!(value > 0)) return '';
  const fixed = value.toFixed(decimals);
  return decimals > 0 ? fixed.replace(/\.?0+$/, '') : fixed;
}

/**
 * The keypad an amount opens in for fixing: the foreign amount as printed, in its currency (the
 * currency key flips to home), or the home amount. Nothing typed for an amount never read.
 */
export function editKeypadOf(
  { amount, foreignAmount }: SpendAmount,
  home: Currency = VND,
): KeypadState {
  const base = homeKeypad(home);
  if (foreignAmount) {
    const decimals = decimalsOf(foreignAmount.currency);
    const foreign = { code: foreignAmount.currency, decimals };
    return {
      ...base,
      digits: digitsOf(foreignAmount.amount, decimals),
      currency: foreign.code,
      foreign,
    };
  }
  return { ...base, digits: digitsOf(toMajor(amount, home), home.minorDigits) };
}

/**
 * A key on the amount being fixed. The first digit (or decimal point) replaces what was there, as
 * typing over a selected field does; delete, k, 000 and the currency key work on it as it is.
 */
export function pressEditKey(state: KeypadState, key: KeypadKey, fresh: boolean): KeypadState {
  const replaces = fresh && (key === '.' || /^\d$/.test(key));
  return pressKey(replaces ? { ...state, digits: '' } : state, key);
}

/** The rate as an exact decimal string, when the number writes as one. */
function rateText(rate: number): string | null {
  if (!(rate > 0)) return null;
  const text = String(rate);
  return DECIMAL_PATTERN.test(text) ? text : null;
}

/**
 * What the row keeps for an amount typed on the keypad. In đồng the foreign amount goes; in the
 * spend's own currency it is re-priced at the rate it was priced at (0₫ while there is none).
 */
export function editedAmount(
  keys: KeypadState,
  original: SpendAmount,
  home: Currency = VND,
): SpendAmount {
  const foreign = original.foreignAmount;
  if (keys.currency === home.code || !foreign || keys.currency !== foreign.currency) {
    return { amount: keypadHomeMinor({ ...keys, home: home.code }), foreignAmount: null };
  }
  const typed = keys.digits.replace(/\.$/, '') || '0';
  const exact = rateText(foreign.rate);
  const priced =
    exact !== null
      ? (foreignToHome(typed, exact, home) ?? 0)
      : foreign.rate > 0
        ? Math.round(Number(typed) * foreign.rate * home.minorPerMajor)
        : 0;
  return { amount: priced, foreignAmount: { ...foreign, amount: Number(typed) } };
}
