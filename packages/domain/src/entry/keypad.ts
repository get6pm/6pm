/**
 * Quick add's keypad. Amounts are typed as digits; `k` and `000` add three zeros ("45" then k is
 * 45.000), the currency key switches between đồng and dollars (and clears), and dollars take up to
 * two decimals. At most 10 digits.
 */
export type KeypadCurrency = 'VND' | 'USD';

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
}

const MAX_DIGITS = 10;

export const emptyKeypad: KeypadState = { digits: '', currency: 'VND' };

export function pressKey(state: KeypadState, key: KeypadKey): KeypadState {
  const { digits, currency } = state;
  const digitCount = digits.replace('.', '').length;
  switch (key) {
    case 'back':
      return { ...state, digits: digits.slice(0, -1) };
    case 'currency':
      return { digits: '', currency: currency === 'VND' ? 'USD' : 'VND' };
    case 'k':
    case '000':
      if (digits === '' || digits === '0' || digits.includes('.')) return state;
      if (digitCount + 3 > MAX_DIGITS) return state;
      return { ...state, digits: digits + '000' };
    case '.':
      if (currency !== 'USD' || digits.includes('.')) return state;
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
      if (decimals !== undefined && decimals.length >= 2) return state;
      if (digits === '0') return { ...state, digits: key };
      return { ...state, digits: digits + key };
    }
  }
}

/** The amount in its own currency: đồng as an integer, dollars with cents. */
export function keypadValue(state: KeypadState): number {
  const value = Number(state.digits || '0');
  return Number.isFinite(value) ? value : 0;
}

/** The amount in đồng, at a rate for dollars. */
export function keypadVnd(state: KeypadState, usdRate: number): number {
  const value = keypadValue(state);
  return state.currency === 'VND' ? Math.round(value) : Math.round(value * usdRate);
}
