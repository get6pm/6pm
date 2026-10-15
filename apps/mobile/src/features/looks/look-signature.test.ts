import { describe, expect, it } from '@jest/globals';

import { LOOK_IDS, lookById, paletteFor } from '@6pm/theme';

import { lookSignature } from './look-signature';

// React Native's own parsers: a gradient or shadow they cannot read is silently not drawn, which
// would leave a look's card blank.
type Parser<T> = (value: string) => T;
const parsers = (path: string) =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- private parsers, loaded for this check
  (require(path) as { default: unknown }).default;
const processBackgroundImage = parsers(
  'react-native/Libraries/StyleSheet/processBackgroundImage',
) as Parser<readonly unknown[] | null>;
const processBoxShadow = parsers('react-native/Libraries/StyleSheet/processBoxShadow') as Parser<
  readonly unknown[]
>;

/** Splits a CSS list at its top-level commas. */
function layers(css: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of css) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else current += char;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

describe('look signatures', () => {
  it('draw only gradients and shadows React Native can read, for every look, variant and hour', () => {
    const unreadable: string[] = [];
    for (const look of LOOK_IDS) {
      for (const [v] of lookById(look).variants.entries()) {
        for (const hour of [8.5, 14, 18.1, 21.5]) {
          const { st } = paletteFor({ look, hour, serious: false, config: { v } });
          const sig = lookSignature(look, v, st, hour);
          const all = [...layers(sig.image), ...layers(sig.sun.image ?? '')];
          for (const layer of all) {
            if (processBackgroundImage(layer)?.length !== 1) unreadable.push(`${look} ${layer}`);
          }
          if (sig.image && processBackgroundImage(sig.image)?.length !== layers(sig.image).length) {
            unreadable.push(`${look} (as one list)`);
          }
          if (sig.sun.glow !== 'none' && processBoxShadow(sig.sun.glow).length === 0) {
            unreadable.push(`${look} ${sig.sun.glow}`);
          }
        }
      }
    }
    expect(unreadable).toEqual([]);
  });

  it('gives each sized layer a size', () => {
    const { st } = paletteFor({ look: 'riso', hour: 14, serious: false });
    const sig = lookSignature('riso', 0, st, 14);
    expect(layers(sig.size)).toHaveLength(layers(sig.image).length);
  });

  it('uses the variant’s own inks, metal and lantern colours', () => {
    const at = (look: 'riso' | 'lacquer' | 'lantern', v: number) => {
      const { st } = paletteFor({ look, hour: 14, serious: false, config: { v } });
      return lookSignature(look, v, st, 14);
    };
    expect(at('riso', 1).sun.color).toBe('#ff6a2c');
    expect(at('lacquer', 1).sun.image).toContain('#e8c070');
    expect(at('lantern', 1).image).toContain('#e33a26');
  });
});
