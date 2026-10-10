import { describe, expect, it } from '@jest/globals';

import { bloomProfile, blurredRadialProfile, scaledBesselI0 } from './blur-profile';

/** ∫ alpha · 2πr dr over the profile's stops (trapezoid). */
function mass(profile: ReturnType<typeof blurredRadialProfile>) {
  let sum = 0;
  for (let i = 1; i < profile.positions.length; i++) {
    const r0 = (profile.positions[i - 1] ?? 0) * profile.radius;
    const r1 = (profile.positions[i] ?? 0) * profile.radius;
    const a0 = profile.alphas[i - 1] ?? 0;
    const a1 = profile.alphas[i] ?? 0;
    sum += ((a0 * r0 + a1 * r1) / 2) * (r1 - r0) * 2 * Math.PI;
  }
  return sum;
}

describe('scaledBesselI0', () => {
  it('matches e^-x I0(x) on both sides of the series switch', () => {
    expect(scaledBesselI0(0)).toBeCloseTo(1, 6);
    expect(scaledBesselI0(1)).toBeCloseTo(1.2660659 * Math.exp(-1), 6);
    expect(scaledBesselI0(5)).toBeCloseTo(27.239872 * Math.exp(-5), 6);
  });
});

describe('blurredRadialProfile', () => {
  const cone = (r: number) => Math.max(0, 1 - r / 100);

  it('keeps the shape when there is no blur', () => {
    const p = blurredRadialProfile(cone, 100, 0, 5);
    expect(p.alphas).toEqual([1, 0.75, 0.5, 0.25, 0]);
  });

  it('spreads the light without losing any of it', () => {
    const sharp = blurredRadialProfile(cone, 100, 0, 201);
    const soft = blurredRadialProfile(cone, 100, 40, 201);
    expect(soft.radius).toBe(240);
    expect(soft.alphas[0]).toBeLessThan(1);
    expect(mass(soft) / mass(sharp)).toBeCloseTo(1, 2);
  });

  it('falls off monotonically to zero at its edge', () => {
    const p = blurredRadialProfile(cone, 100, 40);
    for (let i = 1; i < p.alphas.length; i++) {
      expect(p.alphas[i]).toBeLessThanOrEqual(p.alphas[i - 1] ?? 1);
    }
    expect(p.alphas.at(-1)).toBe(0);
  });
});

describe('bloomProfile', () => {
  it('is the prototype bloom (fades out at 70% of the corner radius) blurred, memoised', () => {
    const stops = { positions: [0, 0.7], alphas: [1, 0] };
    const a = bloomProfile(440, stops, 40);
    expect(bloomProfile(440, stops, 40)).toBe(a);
    expect(a.radius).toBe(220 + 140);
    expect(a.alphas[0]).toBeGreaterThan(0.5);
    expect(a.alphas[0]).toBeLessThan(1);
  });
});
