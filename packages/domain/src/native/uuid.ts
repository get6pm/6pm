/**
 * A random UUID v4 in lower case, for an inbox item made in an extension. JavaScriptCore has no
 * `crypto`, so this draws from `Math.random`: an inbox id only has to differ from the others on
 * this phone, and the app's import is idempotent by id.
 */
export function randomUuid(random: () => number = Math.random): string {
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(random() * 16).toString(16));
  const digits = hex(32);
  digits[12] = '4';
  digits[16] = ((Math.floor(random() * 4) & 0x3) | 0x8).toString(16);
  const s = digits.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
