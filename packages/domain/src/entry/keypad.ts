/**
 * Quick add's keypad. Amounts are typed as digits; `k` and `000` add three zeros ("45" then k is
 * 45.000), the currency key switches between đồng and the other currency (and clears): dollars,
 * or the local currency while travelling. The other currency takes as many decimals as it is
 * written with (two for dollars and baht, none for yen). At most 10 digits.
 */
/** "VND", or the ISO 4217 code of the other currency. */
export type KeypadCurrency = string;

/** The currency the currency key flips to, and its decimals. */
export interface KeypadForeign {
  readonly code: string;
  readonly decimals: number;
}

const DOLLARS: KeypadForeign = { code: 'USD', decimals: 2 };

export type KeypadKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'back'
  | 'k'
  | '000'
  | '.'
  | 'currency';

export interface KeypadState {
  readonly digits: string;
  readonly currency: KeypadCurrency;
  /** The other currency; dollars when not set. */
  readonly foreign?: KeypadForeign;
}

const MAX_DIGITS = 10;

export const emptyKeypad: KeypadState = { digits: '', currency: 'VND' };

/** A keypad that starts in `foreign` (abroad, the local currency) and flips to đồng. */
export function foreignKeypad(foreign: KeypadForeign): KeypadState {
  return { digits: '', currency: foreign.code, foreign };
}

/** Decimals the current currency takes: none for đồng. */
function decimalsOf(state: KeypadState): number {
  if (state.currency === 'VND') return 0;
  return (state.foreign ?? DOLLARS).decimals;
}

export function pressKey(state: KeypadState, key: KeypadKey): KeypadState {
  const { digits, currency } = state;
  const digitCount = digits.replace('.', '').length;
  switch (key) {
    case 'back':
      return { ...state, digits: digits.slice(0, -1) };
    case 'currency':
      return {
        ...state,
        digits: '',
        currency: currency === 'VND' ? (state.foreign ?? DOLLARS).code : 'VND',
      };
    case 'k':
    case '000':
      if (digits === '' || digits === '0' || digits.includes('.')) return state;
      if (digitCount + 3 > MAX_DIGITS) return state;
      return { ...state, digits: digits + '000' };
    case '.':
      if (decimalsOf(state) === 0 || digits.includes('.')) return state;
      return { ...state, digits: (digits === '' ? '0' : digits) + '.' };
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9': {
      if (digitCount >= MAX_DIGITS) return state;
      const decimals = digits.split('.')[1];
      if (decimals !== undefined && decimals.length >= decimalsOf(state)) return state;
      if (digits === '0') return { ...state, digits: key };
      return { ...state, digits: digits + key };
    }
  }
}

/** The amount in its own currency: đồng as an integer, the other currency with its decimals. */
export function keypadValue(state: KeypadState): number {
  const value = Number(state.digits || '0');
  return Number.isFinite(value) ? value : 0;
}

/** The amount in đồng, at a rate for the other currency (see `foreignToVnd` for exact rates). */
export function keypadVnd(state: KeypadState, usdRate: number): number {
  const value = keypadValue(state);
  return state.currency === 'VND' ? Math.round(value) : Math.round(value * usdRate);
}
