const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Bytes as URL-safe base64 with no padding: 32 bytes make 43 characters. */
export function toBase64Url(bytes: Uint8Array): string {
  let text = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    text += ALPHABET[first >> 2];
    text += ALPHABET[((first & 3) << 4) | ((second ?? 0) >> 4)];
    if (second !== undefined) text += ALPHABET[((second & 15) << 2) | ((third ?? 0) >> 6)];
    if (third !== undefined) text += ALPHABET[third & 63];
  }
  return text;
}

/** The bytes of URL-safe base64 text, or `null` for anything that is not exactly that. */
export function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    buffer = (buffer << 6) | ALPHABET.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return Uint8Array.from(bytes);
}
