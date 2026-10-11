// UTF-8 by hand: Hermes is not promised to ship a TextDecoder, and the snapshot is Vietnamese text.

/** The UTF-8 bytes of a string. Lone surrogates become U+FFFD, as `TextEncoder` does. */
export function utf8Encode(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length * 3);
  let at = 0;
  for (let index = 0; index < text.length; index += 1) {
    let code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        index += 1;
      } else {
        code = 0xfffd;
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      code = 0xfffd;
    }
    if (code < 0x80) {
      bytes[at++] = code;
    } else if (code < 0x800) {
      bytes[at++] = 0xc0 | (code >> 6);
      bytes[at++] = 0x80 | (code & 0x3f);
    } else if (code < 0x10000) {
      bytes[at++] = 0xe0 | (code >> 12);
      bytes[at++] = 0x80 | ((code >> 6) & 0x3f);
      bytes[at++] = 0x80 | (code & 0x3f);
    } else {
      bytes[at++] = 0xf0 | (code >> 18);
      bytes[at++] = 0x80 | ((code >> 12) & 0x3f);
      bytes[at++] = 0x80 | ((code >> 6) & 0x3f);
      bytes[at++] = 0x80 | (code & 0x3f);
    }
  }
  // A copy of exactly the bytes used: native code is handed this array.
  return bytes.slice(0, at);
}

const CHUNK = 8192;

/** The string of UTF-8 bytes, or `null` when they are not valid UTF-8. */
export function utf8Decode(bytes: Uint8Array): string | null {
  let text = '';
  let units: number[] = [];
  const continuation = (at: number) => at < bytes.length && ((bytes[at] ?? 0) & 0xc0) === 0x80;
  for (let at = 0; at < bytes.length;) {
    const first = bytes[at] ?? 0;
    let code: number;
    if (first < 0x80) {
      code = first;
      at += 1;
    } else if (first >= 0xc2 && first <= 0xdf && continuation(at + 1)) {
      code = ((first & 0x1f) << 6) | ((bytes[at + 1] ?? 0) & 0x3f);
      at += 2;
    } else if (first >= 0xe0 && first <= 0xef && continuation(at + 1) && continuation(at + 2)) {
      code =
        ((first & 0x0f) << 12) |
        (((bytes[at + 1] ?? 0) & 0x3f) << 6) |
        ((bytes[at + 2] ?? 0) & 0x3f);
      if (code < 0x800 || (code >= 0xd800 && code <= 0xdfff)) return null;
      at += 3;
    } else if (
      first >= 0xf0 &&
      first <= 0xf4 &&
      continuation(at + 1) &&
      continuation(at + 2) &&
      continuation(at + 3)
    ) {
      code =
        ((first & 0x07) << 18) |
        (((bytes[at + 1] ?? 0) & 0x3f) << 12) |
        (((bytes[at + 2] ?? 0) & 0x3f) << 6) |
        ((bytes[at + 3] ?? 0) & 0x3f);
      if (code < 0x10000 || code > 0x10ffff) return null;
      at += 4;
    } else {
      return null;
    }
    if (code >= 0x10000) {
      const offset = code - 0x10000;
      units.push(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    } else {
      units.push(code);
    }
    if (units.length >= CHUNK) {
      text += String.fromCharCode(...units);
      units = [];
    }
  }
  return text + String.fromCharCode(...units);
}
