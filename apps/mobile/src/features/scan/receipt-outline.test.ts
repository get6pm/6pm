import { describe, expect, it } from '@jest/globals';

import {
  MAX_STRAYS,
  MIN_SHARE,
  nextSteadiness,
  quadOnView,
  quadShare,
  readyToTake,
  STEADY_MS,
  unsteady,
  type Steadiness,
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
  // A receipt 200 pt wide: it may shake 16 pt (8% of its width).
  const quad = [100, 100, 300, 100, 300, 500, 100, 500];
  const shaken = quad.map((v) => v + 14);
  const moved = quad.map((v) => v + 40);
  const after = (state: Steadiness, sightings: readonly (readonly number[] | null)[], from = 100) =>
    sightings.reduce((s, q, i) => nextSteadiness(s, q, from + i * 100), state);

  it('starts when the receipt is seen and holds through a hand’s shake', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    expect(nextSteadiness(seen, shaken, 300).since).toBe(0);
  });

  it('lets a stray sighting or a missed one pass, but not the take', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    const strayed = after(seen, [moved, null]);
    expect(strayed.since).toBe(0);
    expect(readyToTake(strayed, STEADY_MS, 400, 800)).toBe(false);
    const back = nextSteadiness(strayed, quad, STEADY_MS);
    expect(back.since).toBe(0);
    expect(readyToTake(back, STEADY_MS, 400, 800)).toBe(true);
  });

  it('starts again when the receipt keeps moving, and ends when it stays gone', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    const moving = Array<readonly number[]>(MAX_STRAYS + 1).fill(moved);
    expect(after(seen, moving).since).toBe(100 * (MAX_STRAYS + 1));
    expect(after(seen, Array<null>(MAX_STRAYS + 1).fill(null))).toBe(unsteady);
  });

  it('starts again on a slow drift, measured from where it settled', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    const drift = [6, 12, 18, 24, 30].map((d) => quad.map((v) => v + d));
    expect(after(seen, drift).since).toBeGreaterThan(0);
  });

  it('takes a large receipt held still long enough, never a small one', () => {
    const seen = nextSteadiness(unsteady, quad, 0);
    expect(readyToTake(seen, STEADY_MS - 1, 400, 800)).toBe(false);
    expect(readyToTake(seen, STEADY_MS, 400, 800)).toBe(true);
    expect(quadShare(quad, 4000, 8000)).toBeLessThan(MIN_SHARE);
    expect(readyToTake(seen, STEADY_MS, 4000, 8000)).toBe(false);
  });
});
