import { describe, expect, it } from '@jest/globals';

import {
  MIN_SHARE,
  nextSteadiness,
  quadOnView,
  quadShare,
  readyToTake,
  STEADY_MS,
  unsteady,
} from './receipt-outline';

const square = [0.25, 0.25, 0.75, 0.25, 0.75, 0.75, 0.25, 0.75];

describe('quadOnView', () => {
  it('maps a frame that fits exactly onto the view', () => {
    expect(quadOnView(square, 0.5, 200, 400)).toEqual([50, 100, 150, 100, 150, 300, 50, 300]);
  });

  it('crops a wider frame at its sides, centred', () => {
    // A 3:4 frame on a 400×1000 view is scaled to 750×1000 and shifted 175 pt left.
    const [x0, y0] = quadOnView([0, 0, 1, 0, 1, 1, 0, 1], 0.75, 400, 1000);
    expect(x0).toBeCloseTo(-175);
    expect(y0).toBe(0);
  });
});

describe('quadShare', () => {
  it('is the quad’s area over the view’s', () => {
    expect(quadShare([0, 0, 100, 0, 100, 100, 0, 100], 200, 200)).toBeCloseTo(0.25);
  });
});

describe('steadiness', () => {
  const quad = [100, 100, 300, 100, 300, 500, 100, 500];
  const nudged = quad.map((v) => v + 4);
  const moved = quad.map((v) => v + 40);

  it('starts when the receipt is seen and holds through small shakes', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    expect(nextSteadiness(seen, nudged, 300).since).toBe(0);
  });

  it('starts again when the receipt moves, and ends when it is gone', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    expect(nextSteadiness(seen, moved, 300).since).toBe(300);
    expect(nextSteadiness(seen, null, 300)).toBe(unsteady);
  });

  it('takes a large receipt held still long enough, never a small one', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    expect(readyToTake(seen, STEADY_MS - 1, 400, 800)).toBe(false);
    expect(readyToTake(seen, STEADY_MS, 400, 800)).toBe(true);
    expect(quadShare(quad, 4000, 8000)).toBeLessThan(MIN_SHARE);
    expect(readyToTake(seen, STEADY_MS, 4000, 8000)).toBe(false);
  });
});
