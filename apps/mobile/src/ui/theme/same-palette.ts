import type { Palette } from '@6pm/theme';

/** Colour tokens are strings, booleans and the five-colour sky; anything else compares by identity. */
function sameToken(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
  }
  return false;
}

/** Whether two palettes hold exactly the same tokens. */
export function samePalette(a: Palette, b: Palette): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => sameToken(a[key], b[key]));
}
