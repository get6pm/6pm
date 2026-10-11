import { describe, expect, it } from '@jest/globals';

import { dropFrame, flashOpacity, fogShift, loop, rainOffset } from './weather-math';

describe('loop', () => {
  it('wraps to 0–1 and treats a negative delay as a head start', () => {
    expect(loop(250, 500)).toBeCloseTo(0.5);
    expect(loop(500, 500)).toBe(0);
    expect(loop(0, 10_000, -2_500)).toBeCloseTo(0.25);
  });
});

describe('rainOffset', () => {
  it('slides one tile height per period and holds at 0 under Reduce Motion', () => {
    expect(rainOffset(0, 500, 140)).toBe(0);
    expect(rainOffset(250, 500, 140)).toBeCloseTo(70);
    expect(rainOffset(400, 800, 230)).toBeCloseTo(115);
  });
});

describe('fogShift', () => {
  it('runs from -12% to +12% of the element width', () => {
    expect(fogShift(0, 804)).toBeCloseTo(-96.48);
    expect(fogShift(1, 804)).toBeCloseTo(96.48);
    expect(fogShift(0.5, 804)).toBeCloseTo(0);
  });
});

describe('flashOpacity', () => {
  it('is dark until the 2 s delay and for the first 88% of each 11 s cycle', () => {
    expect(flashOpacity(0)).toBe(0);
    expect(flashOpacity(1_999)).toBe(0);
    expect(flashOpacity(2_000 + 0.88 * 11_000)).toBeCloseTo(0);
  });

  it('strobes through the keyframes, linearly between them', () => {
    const at = (p: number) => flashOpacity(2_000 + p * 11_000);
    expect(at(0.89)).toBeCloseTo(0.6);
    expect(at(0.895)).toBeCloseTo(0.34);
    expect(at(0.9)).toBeCloseTo(0.08);
    expect(at(0.915)).toBeCloseTo(0.45);
    expect(at(0.935)).toBeCloseTo(0);
    expect(at(0.99)).toBe(0);
  });

  it('repeats every 11 s', () => {
    expect(flashOpacity(2_000 + 11_000 + 0.89 * 11_000)).toBeCloseTo(0.6);
  });
});

describe('dropFrame', () => {
  it('fades in over 8%, holds, and fades out over the last 15% while sliding 260', () => {
    const f = (p: number) => dropFrame(p * 10_000, 10_000, 0);
    expect(f(0)).toEqual({ y: 0, opacity: 0 });
    expect(f(0.04).opacity).toBeCloseTo(0.5);
    expect(f(0.5)).toEqual({ y: 130, opacity: 1 });
    expect(f(0.85).opacity).toBe(1);
    expect(f(0.925).opacity).toBeCloseTo(0.5);
    expect(f(0.925).y).toBeCloseTo(240.5);
  });

  it('starts part-way down for a negative delay', () => {
    expect(dropFrame(0, 10_000, -5_000)).toEqual({ y: 130, opacity: 1 });
  });
});
