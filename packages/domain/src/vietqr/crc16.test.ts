import { describe, expect, it } from 'vitest';

import { crc16CcittFalse } from './crc16';

describe('crc16CcittFalse', () => {
  it('matches the standard check value for "123456789"', () => {
    expect(crc16CcittFalse('123456789')).toBe('29B1');
  });

  it('is FFFF for empty input and always four upper-case hex digits', () => {
    expect(crc16CcittFalse('')).toBe('FFFF');
    expect(crc16CcittFalse('A')).toMatch(/^[0-9A-F]{4}$/);
  });

  it('checksums the UTF-8 bytes of Vietnamese text and emoji', () => {
    // Reference values from an independent byte-level implementation.
    expect(crc16CcittFalse('đ')).toBe('5407');
    expect(crc16CcittFalse('2 suất bún chả')).toBe('B9FB');
    expect(crc16CcittFalse('☕️ cà phê 🍜')).toBe('DDDD');
  });
});
