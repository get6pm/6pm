import { describe, expect, it } from '@jest/globals';

import { CRT_BAR, crtBarTop, secondsToMs, sheenShift, spinAngle, twinkle } from './surface-motion';

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

describe('crtBarTop', () => {
  it('rolls from just above the screen to the bottom edge every 7 s, linearly', () => {
    expect(crtBarTop(0, 800)).toBe(-CRT_BAR);
    expect(crtBarTop(3_500, 800)).toBeCloseTo((-CRT_BAR + 800) / 2);
    expect(crtBarTop(7_000, 800)).toBe(-CRT_BAR);
  });
});

describe('spinAngle', () => {
  it('turns once per period, clockwise, and holds at 0 under Reduce Motion', () => {
    expect(spinAngle(0, 22_000)).toBe(0);
    expect(spinAngle(11_000, 22_000)).toBeCloseTo(Math.PI);
    expect(spinAngle(7_000, 7_000)).toBe(0);
  });
});

describe('twinkle', () => {
  it('starts part-way through for a negative delay and holds at 0 for a positive one', () => {
    expect(twinkle(0, 0, 2_000)).toBe(0);
    expect(twinkle(0, -1_000, 2_000)).toBeCloseTo(0.5);
    expect(twinkle(500, 1_000, 2_000)).toBe(0);
  });
});

describe('secondsToMs', () => {
  it('reads CSS seconds', () => {
    expect(secondsToMs('7s', 1)).toBe(7_000);
    expect(secondsToMs('-1.5s', 1)).toBe(-1_500);
    expect(secondsToMs('fast', 22_000)).toBe(22_000);
  });
});
