import { describe, expect, it } from '@jest/globals';

import { utf8Decode, utf8Encode } from './utf8';

const SAMPLES = [
  '',
  'plain ascii',
  'Phở Thìn · Cà phê Cộng · Tiền nhà',
  '₫ 45.000 — “quoted”',
  'emoji 🍜☕ and 𝒳 outside the BMP',
  'x'.repeat(20_000),
  'Ăn uống '.repeat(5_000),
];

describe('utf8', () => {
  it.each(SAMPLES)('encodes and decodes like the platform: %#', (text) => {
    const bytes = utf8Encode(text);
    expect(Buffer.from(bytes)).toEqual(Buffer.from(text, 'utf8'));
    expect(utf8Decode(bytes)).toBe(text);
  });

  it('replaces a lone surrogate the way TextEncoder does', () => {
    expect(Buffer.from(utf8Encode('a\ud800b'))).toEqual(Buffer.from('a�b', 'utf8'));
  });

  it('refuses bytes that are not UTF-8', () => {
    for (const bad of [
      [0xff],
      [0xc0, 0x80],
      [0xe0, 0x80, 0x80],
      [0xed, 0xa0, 0x80],
      [0xf4, 0x90, 0x80, 0x80],
      [0xe2, 0x82],
      [0x80],
    ]) {
      expect(utf8Decode(Uint8Array.from(bad))).toBeNull();
    }
  });
});
