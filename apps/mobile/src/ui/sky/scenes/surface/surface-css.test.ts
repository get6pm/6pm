import { describe, expect, it } from '@jest/globals';

import { atmosphereFor, paletteFor, type FrameInput } from '@6pm/theme';

import {
  expandStopPairs,
  parseFill,
  surfaceOwnsBlooms,
  surfaceOwnsSky,
  surfaceOwnsSun,
} from './surface-css';

const at = (look: FrameInput['look'], hour: number): FrameInput => ({
  look,
  hour,
  serious: false,
});

describe('expandStopPairs', () => {
  it('splits a two-position stop into two stops of the same colour', () => {
    expect(expandStopPairs('linear-gradient(180deg, #ff0000 0 34%, #00ff00 34% 62%)')).toBe(
      'linear-gradient(180deg, #ff0000 0%, #ff0000 34%, #00ff00 34%, #00ff00 62%)',
    );
  });

  it('leaves single-position stops and ellipse heads alone', () => {
    const css = 'radial-gradient(120% 70% at 50% 100%, #123456 0%, #12345600 70%)';
    expect(expandStopPairs(css)).toBe(css);
  });
});

describe('parseFill', () => {
  it('reads Riso Club’s three flat bands with their hard edges', () => {
    const palette = paletteFor(at('riso', 14));
    const fill = parseFill(palette.sky);
    expect(fill.shapes).toHaveLength(1);
    expect(fill.shapes[0]?.positions).toEqual([0, 0.34, 0.34, 0.62, 0.62, 1]);
    expect(fill.values).toHaveLength(6 * 4);
  });

  it('reads Arcade’s eight bands', () => {
    const fill = parseFill(paletteFor(at('arcade', 14)).sky);
    expect(fill.shapes[0]?.positions).toHaveLength(16);
    expect(fill.shapes[0]?.positions.slice(0, 4)).toEqual([0, 0.125, 0.125, 0.25]);
  });

  it('reads Sơn Mài’s glow over the gradient, bottom layer first', () => {
    const fill = parseFill(paletteFor(at('lacquer', 14)).sky);
    expect(fill.shapes.map((s) => s.kind)).toEqual(['linear', 'radial']);
  });

  it('reads Riso Club’s hard-edged blooms as a disc with a 0.5% fade', () => {
    const atm = atmosphereFor(at('riso', 14), paletteFor(at('riso', 14)), 1);
    const fill = parseFill(String(atm.bloomA));
    expect(fill.shapes[0]?.kind).toBe('radial');
    expect(fill.shapes[0]?.positions).toEqual([0, 0.6, 0.605]);
    expect(fill.values.slice(3, 4)).toEqual([1]);
    expect(fill.values.slice(11, 12)).toEqual([0]);
  });
});

describe('what the surface lane owns', () => {
  it('replaces the shared sky, sun and blooms only where they draw these looks wrongly', () => {
    expect(
      ['arcade', 'riso', 'lacquer', 'holo', 'golden'].map((l) => surfaceOwnsSky(l as never)),
    ).toEqual([true, true, true, false, false]);
    expect(['arcade', 'holo', 'lacquer', 'riso'].map((l) => surfaceOwnsSun(l as never))).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(surfaceOwnsBlooms('riso')).toBe(true);
    expect(surfaceOwnsBlooms('lacquer')).toBe(false);
  });
});
