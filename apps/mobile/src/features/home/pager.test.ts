import { describe, expect, it } from '@jest/globals';

import { followFinger, landingPage } from './pager';

const W = 393;
const at = (position: number, velocity: number, current = 1, lo = 0, hi = 2) =>
  landingPage({ position, velocity, width: W, current, lo, hi });

describe('landingPage', () => {
  it('stays on the page for a short slow drag and moves past half a page', () => {
    expect(at(1 + 60 / W, 0)).toBe(1);
    expect(at(1 + 210 / W, 0)).toBe(2);
    expect(at(1 - 210 / W, 0)).toBe(0);
  });

  it('commits a short quick flick the way the finger was heading', () => {
    // Finger moving left pushes the pages towards the next one.
    expect(at(1 + 40 / W, -600)).toBe(2);
    expect(at(1 - 40 / W, 600)).toBe(0);
  });

  it('springs back when the finger turns round before letting go', () => {
    expect(at(1 + 150 / W, 900)).toBe(1);
  });

  it('moves one page at most, and never past the ends', () => {
    expect(at(1.4, -5000)).toBe(2);
    expect(at(0.2, 5000, 0)).toBe(0);
    expect(at(2.2, -5000, 2)).toBe(2);
  });

  it('holds at a page that is not built yet', () => {
    expect(at(1.6, -800, 1, 0, 1)).toBe(1);
  });
});

describe('followFinger', () => {
  it('follows one to one inside the pages', () => {
    expect(followFinger(1.3, 0, 2, W)).toBe(1.3);
  });

  it('gives less than the finger past either end, keeping the side', () => {
    const past = followFinger(-0.5, 0, 2, W);
    expect(past).toBeLessThan(0);
    expect(past).toBeGreaterThan(-0.5 * 0.55);
    expect(followFinger(2.5, 0, 2, W)).toBeCloseTo(2 - past, 6);
  });
});
