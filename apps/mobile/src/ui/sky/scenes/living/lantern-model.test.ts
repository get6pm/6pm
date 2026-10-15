import { describe, expect, it } from '@jest/globals';

import { bulbValues, lanternModel, lanternValues, wireColor } from './lantern-model';
import { floaters, floatProgress, floatValues, riverModel, riverValues } from './river-model';
import { atmFor } from './test-atm';

describe('lanternModel', () => {
  const model = lanternModel(atmFor('lantern', 18.12));

  it('lays two strings of 21 bulbs and five lanterns from each', () => {
    expect(model?.wires).toHaveLength(42);
    expect(model?.bulbs).toHaveLength(42);
    expect(model?.lanterns).toHaveLength(10);
  });

  it('hangs the back string’s lanterns dimmer and smaller than the front string’s', () => {
    const back = model?.lanterns.slice(0, 5) ?? [];
    const front = model?.lanterns.slice(5) ?? [];
    expect(back.every((l) => l.opacity === 0.78)).toBe(true);
    expect(front.every((l) => l.opacity === 1)).toBe(true);
    expect(Math.max(...back.map((l) => l.w))).toBeLessThanOrEqual(
      Math.min(...front.map((l) => l.w)),
    );
  });

  it('reads each lantern’s ribs and sway, and no sway when the breeze is off', () => {
    expect(model?.lanterns[0]?.rib?.period).toBeGreaterThan(model?.lanterns[0]?.rib?.gap ?? 99);
    expect(model?.lanterns[0]?.sway?.durationMs).toBeGreaterThanOrEqual(2600);
    const still = lanternModel(atmFor('lantern', 18.12, { sway: false }));
    expect(still?.lanterns.every((l) => l.sway === null)).toBe(true);
  });

  it('keeps its tween lengths fixed across hours and variants', () => {
    for (const hour of [8.5, 14, 18.12, 21.5]) {
      for (const v of [0, 1]) {
        const atm = atmFor('lantern', hour, { v });
        expect(bulbValues(atm)).toHaveLength(6 + 4 * 42);
        expect(lanternValues(atm)).toHaveLength(18 * 10);
        expect(wireColor(atm)).toHaveLength(4);
        expect(riverValues(atm)).toHaveLength(1 + 8 * 6);
      }
    }
  });

  it('ramps the glow up from late afternoon', () => {
    const noon = lanternValues(atmFor('lantern', 12));
    const dusk = lanternValues(atmFor('lantern', 18.3));
    // Lantern 0's glow spread (the last value of its 18).
    expect(dusk[17] ?? 0).toBeGreaterThan(noon[17] ?? 99);
  });

  it('is nothing for another look', () => {
    expect(lanternModel(atmFor('golden', 12))).toBeNull();
  });
});

describe('river', () => {
  it('reads five reflections over the wash, and six floating lanterns', () => {
    const atm = atmFor('lantern', 18.12);
    expect(riverModel(atm)?.layers).toHaveLength(6);
    expect(floaters(atm)).toHaveLength(6);
    expect(floatValues(atm)).toHaveLength(14 * 6);
  });

  it('is nothing when the river is off', () => {
    const atm = atmFor('lantern', 18.12, { river: false });
    expect(riverModel(atm)).toBeNull();
    expect(floaters(atm)).toHaveLength(0);
  });

  it('floats a lantern linearly and endlessly from its delay', () => {
    const f = { durationMs: 30_000, delayMs: -15_000 };
    expect(floatProgress(f, 0)).toBeCloseTo(0.5);
    expect(floatProgress(f, 15_000)).toBeCloseTo(0);
    expect(floatProgress(f, 45_000)).toBeCloseTo(0);
  });
});
