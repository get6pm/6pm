import { describe, expect, it } from '@jest/globals';

import { fromBase64Url, toBase64Url } from './base64url';

describe('base64url', () => {
  it('round-trips every length with no padding', () => {
    for (let length = 0; length < 70; length += 1) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + length) % 256);
      const text = toBase64Url(bytes);
      expect(text).toMatch(/^[A-Za-z0-9_-]*$/);
      expect(fromBase64Url(text)).toEqual(bytes);
    }
  });

  it('makes 43 characters from 32 bytes, the length the server expects of a token', () => {
    expect(toBase64Url(new Uint8Array(32).fill(255))).toHaveLength(43);
  });

  it('agrees with the standard encoding', () => {
    const bytes = Uint8Array.from([251, 255, 190, 1, 2, 3, 4]);
    const standard = Buffer.from(bytes).toString('base64url');
    expect(toBase64Url(bytes)).toBe(standard);
  });

  it('refuses text that is not URL-safe base64', () => {
    expect(fromBase64Url('ab+/')).toBeNull();
    expect(fromBase64Url('abc=')).toBeNull();
    expect(fromBase64Url('a')).toBeNull();
  });
});
