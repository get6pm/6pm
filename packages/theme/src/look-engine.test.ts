import { describe, expect, it } from 'vitest';

import { atmosphereFor, configFor, looks, paletteFor, swatchesFor } from './look-engine';
import { LOOK_IDS } from './look-types';

describe('paletteFor', () => {
  it('reproduces Golden Hour at 18:07, the designed Friday', () => {
    const p = paletteFor({ look: 'golden', hour: 18.12, serious: false });
    expect(p.st).toEqual(['#1c275a', '#7a254c', '#733424', '#ffc63d', '#ff4180']);
    expect(p.dark).toBe(true);
    expect(p.accent).toBe('#ff8552');
    expect(p.sheet).toBe('#3a1b1f');
    expect(p.cell).toBe('#553138');
    expect(p.ink).toBe('#fbf4ec');
  });

  it('turns slate, dark and Bricolage in serious mode, whatever the look', () => {
    const p = paletteFor({ look: 'neon', hour: 9, serious: true });
    expect(p.st).toEqual(['#2b2f37', '#353a44', '#40454f', '#5a6070', '#4a5468']);
    expect(p.dark).toBe(true);
    expect(p.accent).toBe('#ff8552');
    expect(p.dispFont).toContain('Bricolage Grotesque');
  });

  it('is light in the morning and follows the chosen variant', () => {
    const saigon = paletteFor({ look: 'golden', hour: 9, serious: false });
    const hoiAn = paletteFor({ look: 'golden', config: { v: 1 }, hour: 9, serious: false });
    expect(saigon.dark).toBe(false);
    expect(hoiAn.st).not.toEqual(saigon.st);
    expect(hoiAn.accent).toBe('#ffa94d');
  });

  it('produces a palette for every look at every hour without throwing', () => {
    for (const look of LOOK_IDS) {
      for (let hour = 6; hour < 24; hour += 0.5) {
        const p = paletteFor({ look, hour, serious: false });
        for (const c of p.st) expect(c).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});

describe('catalogue', () => {
  it('prices looks as designed', () => {
    const all = looks();
    expect(all.golden.price).toBe(0);
    expect(all.basic.price).toBe(0);
    expect(all.neon.price).toBe(49_000);
    expect(all.expo.price).toBe(99_000);
    expect(all.expo.tier).toBe('premium');
  });

  it('fills a look config with its defaults', () => {
    expect(configFor('golden')).toMatchObject({ v: 0, k: 70, flare: true, grain: true });
    expect(configFor('golden', { grain: false }).grain).toBe(false);
  });

  it('gives three swatches per variant', () => {
    expect(swatchesFor('riso', 0)).toEqual(['#f3eee3', '#ff4fa8', '#2f4cb0']);
  });

  it('lists every look the prototype sells, in its order', () => {
    expect(Object.keys(looks()).filter((id) => id !== 'v1')).toEqual([...LOOK_IDS]);
  });
});

describe('atmosphere', () => {
  const at = (look: 'golden' | 'cafe' | 'neon', closed = false, tab = 'today') => {
    const input = { look, hour: 21, serious: false, closed, tab } as const;
    return atmosphereFor(input, paletteFor(input), 0);
  };

  it('hides the moon in scenes that bring their own night', () => {
    expect(at('golden').moonK).toBe(1);
    expect(at('cafe').moonK).toBe(0);
  });

  it('turns Neon Alley’s sign once the day is closed', () => {
    expect(at('neon').signText).toBe('mở cửa');
    expect(at('neon', true).signText).toBe('đóng cửa');
  });

  it('pours Cà Phê’s glass on Today only', () => {
    const today = at('cafe').front as unknown[];
    const plan = at('cafe', false, 'plan').front as unknown[];
    expect(today.length).toBeGreaterThan(plan.length);
  });
});

describe('type and accent ink', () => {
  it('pairs each look with a display face and an interface face', () => {
    const lacquer = paletteFor({ look: 'lacquer', hour: 13, serious: false });
    expect(lacquer.dispFont).toContain('Bodoni Moda');
    expect(lacquer.uiFont).toContain('Literata');
    expect(paletteFor({ look: 'glaze', hour: 13, serious: false }).uiFont).toContain('Epilogue');
  });

  it('keeps the system face for Basic, Golden Hour and serious mode', () => {
    for (const look of ['basic', 'golden'] as const) {
      expect(paletteFor({ look, hour: 13, serious: false }).uiFont).toContain('-apple-system');
    }
    expect(paletteFor({ look: 'riso', hour: 13, serious: true }).uiFont).toContain('-apple-system');
  });

  it('gives each look its own ink on the accent', () => {
    expect(paletteFor({ look: 'golden', hour: 18.12, serious: false }).accentFg).toBe('#2a1424');
    expect(paletteFor({ look: 'lacquer', hour: 18.12, serious: false }).accentFg).toBe('#1c1006');
  });

  it('shrinks Riso Club’s wide numbers', () => {
    const riso = paletteFor({ look: 'riso', hour: 13, serious: false });
    expect(riso.heroSize).toBe('76px');
    expect(riso.numK).toBe(0.8);
  });
});
