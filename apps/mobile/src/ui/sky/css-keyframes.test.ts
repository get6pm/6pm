import { describe, expect, it } from '@jest/globals';

import { alternating, drift1, driftAt, grainOffset, grainStep } from './css-keyframes';

describe('alternating', () => {
  it('eases forward, then back, like `ease-in-out infinite alternate`', () => {
    expect(alternating(0, 1000)).toBeCloseTo(0);
    expect(alternating(500, 1000)).toBeCloseTo(0.5);
    expect(alternating(1000, 1000)).toBeCloseTo(1);
    expect(alternating(1500, 1000)).toBeCloseTo(0.5);
    expect(alternating(2000, 1000)).toBeCloseTo(0);
    // ease-in-out is slow at the ends
    expect(alternating(100, 1000)).toBeLessThan(0.1);
  });

  it('starts from the end when reversed', () => {
    expect(alternating(0, 1000, true)).toBeCloseTo(1);
    expect(alternating(1000, 1000, true)).toBeCloseTo(0);
  });
});

describe('driftAt', () => {
  it('translates and scales about the centre', () => {
    const atRest = driftAt(drift1(19_000), 0, 100, 200);
    expect(atRest).toEqual([
      { translateX: 100 },
      { translateY: 200 },
      { scale: 1 },
      { translateX: -100 },
      { translateY: -200 },
    ]);
    const full = driftAt(drift1(19_000), 19_000, 100, 200);
    expect(full[0]?.translateX).toBeCloseTo(160);
    expect(full[1]?.translateY).toBeCloseTo(150);
    expect(full[2]?.scale).toBeCloseTo(1.18);
  });
});

describe('grainOffset', () => {
  it('steps through three offsets every 0.8 s', () => {
    expect(grainOffset(0)).toEqual([0, 0]);
    expect(grainOffset(300)).toEqual([-47, 31]);
    expect(grainOffset(600)).toEqual([63, -22]);
    expect(grainOffset(800)).toEqual([0, 0]);
    expect([0, 263, 264, 527, 528, 799].map(grainStep)).toEqual([0, 0, 1, 1, 2, 2]);
  });
});
