import { describe, expect, it } from 'vitest';

import { configFor, looks, paletteFor, swatchesFor } from './look-engine';
import { LOOK_IDS } from './look-types';

describe('paletteFor', () => {
  it('reproduces Golden Hour at 18:07, the designed Friday', () => {
    const p = paletteFor({ look: 'golden', hour: 18.12, serious: false });
    expect(p.st).toEqual(['#1c275a', '#bc376c', '#ff7237', '#ffc63d', '#ff4180']);
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
    expect(swatchesFor('riso', 0)).toEqual(['#f5efe3', '#ff48b0', '#3a5bd9']);
  });
});
