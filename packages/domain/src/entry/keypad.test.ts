import { describe, expect, it } from 'vitest';

import {
  emptyKeypad,
  foreignKeypad,
  keypadVnd,
  pressKey,
  type KeypadKey,
  type KeypadState,
} from './keypad';

const type = (keys: KeypadKey[], start: KeypadState = emptyKeypad) => keys.reduce(pressKey, start);

describe('quick add keypad', () => {
  it('types 45 then k as 45.000₫', () => {
    expect(keypadVnd(type(['4', '5', 'k']), 25_400)).toBe(45_000);
    expect(keypadVnd(type(['1', '2', '000']), 25_400)).toBe(12_000);
  });

  it('ignores k on nothing, on zero and after a decimal', () => {
    expect(type(['k']).digits).toBe('');
    expect(type(['0', 'k']).digits).toBe('0');
    const usd = type(['currency', '3', '.', '5', 'k']);
    expect(usd.digits).toBe('3.5');
  });

  it('converts dollars at the rate, two decimals at most', () => {
    const usd = type(['currency', '3', '.', '5', '0', '9']);
    expect(usd.digits).toBe('3.50');
    expect(keypadVnd(usd, 25_400)).toBe(88_900);
  });

  it('allows a decimal only in dollars, and clears when the currency flips', () => {
    expect(type(['4', '.']).digits).toBe('4');
    expect(type(['4', 'currency']).digits).toBe('');
  });

  it('stops at ten digits and deletes one at a time', () => {
    const long = type(Array.from({ length: 12 }, () => '9' as const));
    expect(long.digits).toHaveLength(10);
    expect(type(['4', '5', 'back']).digits).toBe('4');
  });

  it('replaces a leading zero', () => {
    expect(type(['0', '7']).digits).toBe('7');
  });
});

describe('the keypad abroad', () => {
  const baht = foreignKeypad({ code: 'THB', decimals: 2 });
  const yen = foreignKeypad({ code: 'JPY', decimals: 0 });

  it('starts in the local currency and flips to đồng and back', () => {
    expect(baht.currency).toBe('THB');
    const dong = type(['1', 'currency'], baht);
    expect(dong).toMatchObject({ digits: '', currency: 'VND' });
    expect(type(['currency'], dong).currency).toBe('THB');
  });

  it('takes the decimals the currency is written with', () => {
    expect(type(['1', '2', '.', '5', '0', '1'], baht).digits).toBe('12.50');
    expect(type(['1', '2', '.', '5'], yen).digits).toBe('125');
  });
});
