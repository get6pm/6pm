/** Number of bytes a Unicode code point takes in UTF-8. */
export function utf8Size(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

function* utf8Bytes(text: string): Generator<number> {
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    const size = utf8Size(cp);
    if (size === 1) {
      yield cp;
      continue;
    }
    const lead = [0, 0, 0xc0, 0xe0, 0xf0][size] ?? 0;
    yield lead | (cp >> (6 * (size - 1)));
    for (let shift = 6 * (size - 2); shift >= 0; shift -= 6) yield 0x80 | ((cp >> shift) & 0x3f);
  }
}

/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection, no final xor) over the UTF-8
 * bytes of `text`, as four upper-case hex digits. This is the checksum EMVCo QR codes carry in
 * tag 63, computed over the whole payload up to and including "6304".
 */
export function crc16CcittFalse(text: string): string {
  let crc = 0xffff;
  for (const byte of utf8Bytes(text)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
