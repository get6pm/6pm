import { describe, expect, it } from '@jest/globals';

import { sheenShift } from './surface-motion';

describe('sheenShift', () => {
  const box = 1000;
  it('starts at -35% of the band and rests at +35% for the last 45% of the cycle', () => {
    expect(sheenShift(0, box)).toBeCloseTo(-350);
    expect(sheenShift(9_000 * 0.55, box)).toBeCloseTo(350);
    expect(sheenShift(9_000 * 0.8, box)).toBeCloseTo(350);
    expect(sheenShift(9_000 - 1, box)).toBeCloseTo(350);
  });

  it('eases through the middle and restarts every 9 s', () => {
    expect(sheenShift(9_000 * 0.275, box)).toBeCloseTo(0, 0);
    expect(sheenShift(9_000, box)).toBeCloseTo(-350);
    expect(sheenShift(9_000 + 2_000, box)).toBeCloseTo(sheenShift(2_000, box));
  });
});
