import { describe, expect, it } from '@jest/globals';

import {
  RESTART,
  screenOpacity,
  stage,
  touchOpacity,
  touchPoint,
  touchPress,
  type TouchStop,
} from './timeline';

const STOPS: readonly TouchStop[] = [
  { at: 0.1, x: 0, y: 0 },
  { at: 0.4, x: 100, y: 200, tap: true },
];

describe('stage', () => {
  it('is 0 before its window, 1 after it, and eases in between', () => {
    expect(stage(0.1, 0.2, 0.3)).toBe(0);
    expect(stage(0.35, 0.2, 0.3)).toBe(1);
    const mid = stage(0.25, 0.2, 0.3);
    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(1);
  });

  it('goes back to the start once the screen has faded out for the restart', () => {
    expect(stage(RESTART - 0.01, 0.2, 0.3)).toBe(1);
    expect(stage(RESTART, 0.2, 0.3)).toBe(0);
  });

  it('switches at once for an empty window', () => {
    expect(stage(0.19, 0.2, 0.2)).toBe(0);
    expect(stage(0.2, 0.2, 0.2)).toBe(1);
  });
});

describe('screenOpacity', () => {
  it('is whole while the step plays and dips to nothing as it restarts', () => {
    expect(screenOpacity(0.5)).toBe(1);
    expect(screenOpacity(RESTART)).toBe(0);
    expect(screenOpacity(1)).toBe(1);
  });
});

describe('the finger', () => {
  it('rests on its first stop, then arrives at the next before it taps there', () => {
    expect(touchPoint(0, STOPS)).toEqual({ x: 0, y: 0 });
    // Gliding takes the first 70 % of the gap; the rest is a pause before the tap.
    expect(touchPoint(0.1 + 0.3 * 0.7, STOPS)).toEqual({ x: 100, y: 200 });
    expect(touchPoint(0.6, STOPS)).toEqual({ x: 100, y: 200 });
    const between = touchPoint(0.2, STOPS);
    expect(between.x).toBeGreaterThan(0);
    expect(between.x).toBeLessThan(100);
  });

  it('presses only around a tap stop', () => {
    expect(touchPress(0.4, STOPS)).toBe(1);
    expect(touchPress(0.3, STOPS)).toBe(0);
    expect(touchPress(0.5, STOPS)).toBe(0);
    expect(touchPress(0.1, STOPS)).toBe(0);
  });

  it('fades in just before its first stop and out before the step settles', () => {
    expect(touchOpacity(0, STOPS)).toBe(0);
    expect(touchOpacity(0.1, STOPS)).toBe(1);
    expect(touchOpacity(0.6, STOPS)).toBe(1);
    expect(touchOpacity(0.86, STOPS)).toBe(0);
  });
});
