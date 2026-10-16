import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { payCycleOn } from './pay-cycle';
import { goalMonthly } from './plan-river';
import { potSetAside, potTopUp, rebalanceShares } from './pots';

const percents = (shares: Record<string, number>) =>
  Object.values(shares).map((s) => Math.round(s * 100));

describe('rebalanceShares never gives a goal less than nothing', () => {
  it('splits what a 97% pin leaves between five goals as whole percents', () => {
    const split = rebalanceShares({ a: 0.97, b: 0.2, c: 0.2, d: 0.2, e: 0.2, f: 0.2 }, 'a');
    expect(split.a).toBe(0.97);
    for (const id of ['b', 'c', 'd', 'e', 'f']) {
      expect(split[id]).toBeGreaterThanOrEqual(0);
      expect(Object.is(split[id], -0)).toBe(false);
    }
    expect(percents(split).reduce((x, y) => x + y, 0)).toBe(100);
  });

  it('keeps every share in [0, 1], whole percents adding up to 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(fc.double({ min: -1, max: 2, noNaN: true }), fc.constant(Number.NaN)), {
          minLength: 1,
          maxLength: 12,
        }),
        fc.boolean(),
        (values, pinFirst) => {
          const shares = Object.fromEntries(values.map((v, i) => [`g${String(i)}`, v]));
          const pin = pinFirst ? Object.keys(shares)[0] : undefined;
          const split = rebalanceShares(shares, pin);
          expect(Object.keys(split).sort()).toEqual(Object.keys(shares).sort());
          for (const share of Object.values(split)) {
            expect(share).toBeGreaterThanOrEqual(0);
            expect(share).toBeLessThanOrEqual(1);
            expect(Object.is(share, -0)).toBe(false);
            expect(Math.abs(share * 100 - Math.round(share * 100))).toBeLessThan(1e-9);
          }
          expect(percents(split).reduce((x, y) => x + y, 0)).toBe(100);
        },
      ),
    );
  });
});

describe('a goal sets nothing aside below zero', () => {
  it('clamps a negative share or Future you to nothing', () => {
    expect(goalMonthly(2_000_000, -0.01)).toBe(0);
    expect(goalMonthly(-2_000_000, 0.5)).toBe(0);
    const pot = {
      kind: 'goal' as const,
      goal: 5_000_000,
      neededBy: null,
      share: -0.01,
      paused: false,
    };
    const cycle = payCycleOn('2026-10-09', { kind: 'lastDay' });
    expect(potSetAside({ pot, savedBefore: 0, futureYou: 2_000_000, cycle })).toBe(0);
  });
});

describe('potTopUp', () => {
  it('adds the step, only what is left near the goal, and nothing once full', () => {
    expect(potTopUp(2_000_000, 0, 100_000)).toBe(100_000);
    expect(potTopUp(2_000_000, 1_950_000, 100_000)).toBe(50_000);
    expect(potTopUp(2_000_000, 2_000_000, 100_000)).toBe(0);
    expect(potTopUp(2_000_000, 2_300_000, 100_000)).toBe(0);
  });
});
