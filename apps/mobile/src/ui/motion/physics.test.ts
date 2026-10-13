import { describe, expect, it } from '@jest/globals';

import { project, rubberband } from './physics';

describe('project', () => {
  it('sends a fast flick far and a slow release almost nowhere', () => {
    expect(project(1500)).toBeCloseTo(748.5, 1);
    expect(project(50)).toBeCloseTo(24.95, 2);
    expect(project(-1000)).toBeCloseTo(-499, 0);
    expect(project(0)).toBe(0);
  });
});

describe('rubberband', () => {
  it('follows about half the finger at first, and less the further past the edge', () => {
    expect(rubberband(10, 800)).toBeCloseTo(5.46, 1);
    const far = rubberband(400, 800);
    expect(far).toBeLessThan(400 * 0.55);
    expect(rubberband(800, 800)).toBeLessThan(800 * 0.4);
  });

  it('keeps the sign of the overshoot', () => {
    expect(rubberband(-100, 800)).toBeCloseTo(-rubberband(100, 800), 6);
  });
});
