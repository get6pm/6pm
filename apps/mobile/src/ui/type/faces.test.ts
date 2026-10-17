import { describe, expect, it } from '@jest/globals';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { LOOK_IDS, paletteFor } from '@6pm/theme';

import { faceOf, firstFamily, type Face } from './faces';

const shipped = new Set(
  readdirSync(join(__dirname, '../../../assets/fonts')).map((f) =>
    f.replace(/(-Variable)?\.ttf$/, ''),
  ),
);

/** The font files a face can name, across the weights the app sets. */
function filesOf(face: Face): string[] {
  if (face.kind === 'system') return [];
  if (face.kind === 'variable') return [face.family];
  return [400, 500, 550, 600, 650, 700, 800].map(face.byWeight);
}

describe('look faces', () => {
  it('ships every face each look names, display and interface', () => {
    for (const look of LOOK_IDS) {
      const p = paletteFor({ look, hour: 13, serious: false });
      const shown = faceOf(p.dispFont, 'display');
      const ui = faceOf(p.uiFont, 'ui');
      if (!/apple-system/.test(p.dispFont)) {
        expect(shown.kind === 'variable' && shown.family === 'BricolageGrotesque').toBe(
          firstFamily(p.dispFont) === 'Bricolage Grotesque',
        );
      }
      if (!/apple-system/.test(p.uiFont)) expect(ui.kind).not.toBe('system');
      for (const file of [...filesOf(shown), ...filesOf(ui)]) expect(shipped).toContain(file);
    }
  });

  it('keeps SF Pro for Basic and Golden Hour text', () => {
    for (const look of ['basic', 'golden'] as const) {
      const p = paletteFor({ look, hour: 13, serious: false });
      expect(faceOf(p.uiFont, 'ui').kind).toBe('system');
    }
  });

  it('sets the nearest static cut, and clamps a variable weight to the file', () => {
    const bai = faceOf("'Bai Jamjuree', system-ui, sans-serif", 'ui');
    expect(bai.kind === 'static' && bai.byWeight(650)).toBe('BaiJamjuree-Bold');
    expect(bai.kind === 'static' && bai.byWeight(550)).toBe('BaiJamjuree-SemiBold');
    const alegreya = faceOf("'Alegreya Sans', system-ui, sans-serif", 'ui');
    expect(alegreya.kind === 'static' && alegreya.byWeight(600)).toBe('AlegreyaSans-Bold');
  });

  it('draws the faces with no Vietnamese, and the dated ones, in their replacements', () => {
    expect(faceOf("'Bodoni Moda', Didot, serif", 'display')).toMatchObject({ kind: 'static' });
    const sonMai = faceOf("'Bodoni Moda', Didot, serif", 'display');
    expect(sonMai.kind === 'static' && sonMai.byWeight(500)).toBe('Prata-Regular');
    expect(faceOf("'Barlow Condensed', sans-serif", 'display')).toMatchObject({
      family: 'BigShouldersDisplay',
    });
    expect(faceOf("'Baloo 2', sans-serif", 'display')).toMatchObject({ family: 'Grandstander' });
    expect(faceOf("'Barlow', sans-serif", 'ui')).toMatchObject({ family: 'Geist' });
    expect(faceOf("'Nunito', sans-serif", 'ui')).toMatchObject({ family: 'Lexend' });
  });
});
