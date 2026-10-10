import { utf8Size } from './crc16';

/**
 * How a TLV length is counted. EMVCo counts characters; some Vietnamese generators count UTF-8
 * bytes when a note carries diacritics, so the reader can retry with bytes.
 */
export type LengthUnit = 'chars' | 'bytes';

/** Top-level or nested EMVCo data objects, tag → value, in payload order. */
export type TlvFields = ReadonlyMap<string, string>;

const TWO_DIGITS = /^\d\d$/;

/**
 * Splits an EMVCo "ID (2 digits) · length (2 digits) · value" string. Returns null when the
 * data is truncated, a tag or length is not two digits, or a tag repeats.
 */
export function parseTlv(text: string, unit: LengthUnit = 'chars'): TlvFields | null {
  const chars = Array.from(text);
  const fields = new Map<string, string>();
  let i = 0;
  while (i < chars.length) {
    const tag = chars.slice(i, i + 2).join('');
    const len = chars.slice(i + 2, i + 4).join('');
    if (!TWO_DIGITS.test(tag) || !TWO_DIGITS.test(len)) return null;
    i += 4;
    const want = Number(len);
    let taken = 0;
    const start = i;
    while (taken < want && i < chars.length) {
      taken += unit === 'bytes' ? utf8Size(chars[i]?.codePointAt(0) ?? 0) : 1;
      i++;
    }
    if (taken !== want) return null;
    if (fields.has(tag)) return null;
    fields.set(tag, chars.slice(start, i).join(''));
  }
  return fields;
}

/** Number of length units `value` takes. */
export function tlvLength(value: string, unit: LengthUnit = 'chars'): number {
  let n = 0;
  for (const char of value) n += unit === 'bytes' ? utf8Size(char.codePointAt(0) ?? 0) : 1;
  return n;
}

/** Encodes one data object. Throws when the value is longer than the 99 units a TLV can hold. */
export function encodeTlv(tag: string, value: string): string {
  const len = tlvLength(value);
  if (!TWO_DIGITS.test(tag)) throw new RangeError(`EMV tag must be two digits: ${tag}`);
  if (len > 99) throw new RangeError(`EMV field ${tag} is longer than 99 characters`);
  return tag + String(len).padStart(2, '0') + value;
}
