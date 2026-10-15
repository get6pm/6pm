import { describe, expect, it } from '@jest/globals';

import { LOOK_IDS, type FrameInput } from '@6pm/theme';

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
});
