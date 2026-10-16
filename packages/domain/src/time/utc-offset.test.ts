import { describe, expect, it } from 'vitest';

import { dayStartAtOffset, readUtcOffset, utcOffsetOf } from './utc-offset';

describe('readUtcOffset', () => {
  it('reads minutes east of UTC, either sign', () => {
    expect(readUtcOffset('420')).toBe(420);
    expect(readUtcOffset('+330')).toBe(330);
    expect(readUtcOffset('-300')).toBe(-300);
  });

  it('keeps to the offsets time zones have: ±14 hours', () => {
    expect(readUtcOffset('840')).toBe(840);
    expect(readUtcOffset('-840')).toBe(-840);
    expect(readUtcOffset('841')).toBe(0);
    expect(readUtcOffset('-9999')).toBe(0);
  });

  it('falls back to UTC when nothing readable is said', () => {
    expect(readUtcOffset(undefined)).toBe(0);
    expect(readUtcOffset(null)).toBe(0);
    expect(readUtcOffset('')).toBe(0);
    expect(readUtcOffset('7h')).toBe(0);
    expect(readUtcOffset('4.5')).toBe(0);
    expect(readUtcOffset('-0')).toBe(0);
  });
});

describe('dayStartAtOffset', () => {
  it("is the user's midnight, not UTC's", () => {
    // 00:30 in Hà Nội on the 16th is 17:30 UTC on the 15th.
    const now = new Date('2026-10-15T17:30:00.000Z');
    expect(dayStartAtOffset(now, 420)).toBe('2026-10-15T17:00:00.000Z');
    expect(dayStartAtOffset(now, 0)).toBe('2026-10-15T00:00:00.000Z');
  });

  it('works west of UTC too', () => {
    // 20:00 in New York (UTC−4) on the 15th is 00:00 UTC on the 16th.
    const now = new Date('2026-10-16T00:00:00.000Z');
    expect(dayStartAtOffset(now, -240)).toBe('2026-10-15T04:00:00.000Z');
  });
});

describe('utcOffsetOf', () => {
  it('counts east of UTC, opposite to getTimezoneOffset', () => {
    const now = new Date();
    expect(utcOffsetOf(now)).toBe(-now.getTimezoneOffset() || 0);
  });
});
