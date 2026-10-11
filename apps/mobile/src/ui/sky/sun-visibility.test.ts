import { describe, expect, it } from '@jest/globals';

import { LOOK_IDS, paletteFor, type FrameInput } from '@6pm/theme';

import { paperSunModel } from './scenes/living/paper-sun-model';
import { sunFrame } from './scenes/surface/surface-sun-spec';
import { skyFrame } from './sky-frame';

/**
 * The sun is switched on a shared value on the UI thread, so both of its states are prepared up
 * front and only the tweened numbers may differ between them: everything else must be the same.
 */
const HOURS = Array.from({ length: 49 }, (_, i) => i / 2);
const lookInput = (look: FrameInput['look'], hour: number, serious: boolean): FrameInput => ({
  look,
  hour,
  serious,
});

describe('the sun shown or hidden', () => {
  it('leaves the sky layout and the number of tweened slots unchanged', () => {
    for (const look of LOOK_IDS) {
      for (const hour of HOURS) {
        const on = skyFrame({ ...lookInput(look, hour, false), showSun: true });
        const off = skyFrame({ ...lookInput(look, hour, false), showSun: false });
        expect(off.layout).toEqual(on.layout);
        expect(off.values).toHaveLength(on.values.length);
        expect(off.atm['rainOn']).toEqual(on.atm['rainOn']);
      }
    }
  });

  it('leaves the surface sun’s shape and the paper sun’s geometry unchanged', () => {
    for (const look of LOOK_IDS) {
      for (const hour of HOURS) {
        const input = lookInput(look, hour, false);
        const palette = paletteFor(input);
        const on = sunFrame({ ...input, showSun: true }, palette);
        const off = sunFrame({ ...input, showSun: false }, palette);
        expect(off === null).toBe(on === null);
        if (on && off) {
          expect(off.shape).toEqual(on.shape);
          expect(off.values).toHaveLength(on.values.length);
        }
        const paperOn = paperSunModel({ ...input, palette, showSun: true });
        const paperOff = paperSunModel({ ...input, palette, showSun: false });
        const { values: onValues, ...onRest } = paperOn;
        const { values: offValues, ...offRest } = paperOff;
        expect(offRest).toEqual(onRest);
        expect(offValues).toHaveLength(onValues.length);
      }
    }
  });
});
