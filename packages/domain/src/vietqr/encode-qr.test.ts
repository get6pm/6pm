import { describe, expect, it } from 'vitest';

import { encodeQR, type QrMatrix } from './encode-qr';

const text = (m: QrMatrix) => m.rows.map((row) => row.map((on) => (on ? '1' : '0')).join(''));

/** FNV-1a over the matrix as 0/1 rows, to pin a large code to a reference in one number. */
function fingerprint(m: QrMatrix): number {
  let h = 0x811c9dc5;
  for (const ch of text(m).join('')) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h;
}

// Every expected value below came from the Python `qrcode` 8.2 encoder in byte mode, with the same
// level and mask; 112 such codes (versions 1–29, both levels, every mask) matched it exactly.
const VIETQR =
  '00020101021238560010A0000007270126000697040301120601014539980208QRIBFTTA5303704540510000' +
  '5802VN621208086pm test63045D29';

describe('encodeQR', () => {
  it('draws "hello" exactly as the reference does', () => {
    expect(text(encodeQR('hello', { level: 'M', mask: 3 }))).toEqual([
      '111111101000001111111',
      '100000101000001000001',
      '101110100101001011101',
      '101110101010101011101',
      '101110100111001011101',
      '100000100111101000001',
      '111111101010101111111',
      '000000001111100000000',
      '101101110101101001011',
      '111010010011111001101',
      '110111101101000000011',
      '110101000111001111010',
      '010100111100100100001',
      '000000001011001000100',
      '111111101011100100000',
      '100000101010000111110',
      '101110100000111111111',
      '101110101011001011110',
      '101110101000101100100',
      '100000100000010110001',
      '111111101110010100100',
    ]);
  });

  it.each([
    ['a VietQR transfer', VIETQR, 'M', 5, 45, 0x1f383493],
    ['a long code across many blocks', `000201010211${'x'.repeat(400)}`, 'M', 6, 77, 0x0e61142a],
    ['UTF-8 text', 'Cà phê sữa đá — 25.000₫', 'L', 2, 29, 0x496be19a],
  ] as const)('matches the reference for %s', (_, input, level, mask, size, print) => {
    const qr = encodeQR(input, { level, mask });
    expect(qr.size).toBe(size);
    expect(fingerprint(qr)).toBe(print);
  });

  it('picks the smallest version, at level M', () => {
    expect(encodeQR('A').size).toBe(21);
    expect(encodeQR('x'.repeat(14)).size).toBe(21);
    expect(encodeQR('x'.repeat(15)).size).toBe(25);
  });

  it('drops to level L for a text M cannot hold, and refuses one no code can', () => {
    expect(encodeQR('x'.repeat(2900)).size).toBe(177);
    expect(() => encodeQR('x'.repeat(3000))).toThrow(RangeError);
  });

  it('keeps the three finder patterns in their corners whatever the mask', () => {
    const qr = encodeQR(VIETQR);
    const corner = (x: number, y: number) =>
      text({ size: 7, rows: qr.rows.slice(y, y + 7).map((r) => r.slice(x, x + 7)) });
    const finder = ['1111111', '1000001', '1011101', '1011101', '1011101', '1000001', '1111111'];
    expect(corner(0, 0)).toEqual(finder);
    expect(corner(qr.size - 7, 0)).toEqual(finder);
    expect(corner(0, qr.size - 7)).toEqual(finder);
  });
});
