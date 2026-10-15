import { travelCurrency } from '../travel/currencies';
import { DECIMAL_PATTERN, foreignToVnd } from '../travel/fx';
import { emptyKeypad, keypadValue, pressKey, type KeypadKey, type KeypadState } from './keypad';

/** A spend's amount as its row keeps it: đồng, and the foreign amount it was priced from. */
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
 * currency key flips to đồng), or the đồng. Nothing typed for an amount that was never read.
 */
export function editKeypadOf({ amount, foreignAmount }: SpendAmount): KeypadState {
  if (foreignAmount) {
    const decimals = decimalsOf(foreignAmount.currency);
    const foreign = { code: foreignAmount.currency, decimals };
    return { digits: digitsOf(foreignAmount.amount, decimals), currency: foreign.code, foreign };
  }
  return { ...emptyKeypad, digits: digitsOf(amount, 0) };
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
export function editedAmount(keys: KeypadState, original: SpendAmount): SpendAmount {
  const foreign = original.foreignAmount;
  if (keys.currency === 'VND' || !foreign || keys.currency !== foreign.currency) {
    return { amount: Math.round(keypadValue(keys)), foreignAmount: null };
  }
  const typed = keys.digits.replace(/\.$/, '') || '0';
  const exact = rateText(foreign.rate);
  const vnd =
    exact !== null
      ? (foreignToVnd(typed, exact) ?? 0)
      : foreign.rate > 0
        ? Math.round(Number(typed) * foreign.rate)
        : 0;
  return { amount: vnd, foreignAmount: { ...foreign, amount: Number(typed) } };
}
