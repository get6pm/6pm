import { describe, expect, it } from '@jest/globals';

import { t as translate, type Language } from '@6pm/i18n';
import { LOOK_IDS, lookById } from '@6pm/theme';

import { lookCopy } from './look-copy';

const copyIn = (language: Language) =>
  lookCopy(((key: string) =>
    (translate as (l: Language, k: string) => string)(language, key)) as never);

describe('look copy', () => {
  it('says the theme engine’s English for every look, in English', () => {
    const copy = copyIn('en');
    for (const id of LOOK_IDS) {
      const def = lookById(id);
      expect(copy.name(id)).toBe(def.name);
      expect(copy.tag(id)).toBe(def.tag);
      expect(copy.intensity(id)).toBe(def.kName);
      for (const control of def.ctl) {
        expect(copy.controlLabel(id, control)).toBe(control.label);
        expect(copy.controlSub(id, control)).toBe(control.sub);
      }
      for (const [index, variant] of def.variants.entries()) {
        expect(copy.variant(id, index)).toBe(variant.name);
      }
    }
  });

  it('has Vietnamese for every look, never an empty string', () => {
    const copy = copyIn('vi');
    for (const id of LOOK_IDS) {
      const def = lookById(id);
      expect(copy.name(id)).not.toBe('');
      expect(copy.tag(id)).not.toBe(def.tag);
      for (const control of def.ctl) {
        expect(copy.controlLabel(id, control)).not.toBe(control.label);
        expect(copy.controlSub(id, control)).not.toBe(control.sub);
      }
      for (const [index] of def.variants.entries()) {
        expect(copy.variant(id, index)).not.toBe('');
      }
    }
    expect(copy.name('golden')).toBe('Giờ vàng');
    expect(copy.name('neon')).toBe('Neon Alley');
  });
});
