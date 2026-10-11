import { describe, expect, it } from '@jest/globals';

import { carOffset, carProgress, expoModel } from './expo-model';
import { atmFor } from './test-atm';

describe('expoModel', () => {
  const model = expoModel(atmFor('expo', 18.12));

  it('reads the three star trails the prototype draws, with their rings and arcs', () => {
    expect(model?.trails.map((t) => t.period)).toEqual([9, 13, 22]);
    expect(model?.trails.map((t) => t.fromDeg)).toEqual([0, 110, 230]);
    expect(model?.trails.map((t) => t.spanDeg)).toEqual([70, 55, 85]);
    expect(model?.trails[0]?.ink).toEqual([1, 1, 1, 0.55]);
    expect(model?.pole).toEqual({ x: 0.82, y: 64 });
  });

  it('reads twelve cars on four lanes, half heading each way', () => {
    expect(model?.cars).toHaveLength(12);
    expect(model?.cars.filter((c) => c.direction === 1)).toHaveLength(6);
    expect(new Set(model?.cars.map((c) => c.y))).toEqual(new Set([36, 48, 70, 82]));
    for (const car of model?.cars ?? []) {
      expect(car.durationMs).toBeGreaterThanOrEqual(2200);
      expect(car.delayMs).toBeLessThanOrEqual(0);
    }
  });

  it('reads the four lane glints as bands of the traffic box', () => {
    expect(model?.lanes).toEqual([
      { from: 0.29, to: 0.305 },
      { from: 0.39, to: 0.405 },
      { from: 0.57, to: 0.585 },
      { from: 0.67, to: 0.685 },
    ]);
    expect(model?.colors).toHaveLength(32);
  });

  it('keeps the layer structure when a switch is off, so a toggle never reshapes it', () => {
    const off = expoModel(atmFor('expo', 18.12, { stars: false, traffic: false }));
    expect(off?.stars).toBe(false);
    expect(off?.traffic).toBe(false);
    expect(off?.cars).toHaveLength(12);
    expect(off?.colors).toHaveLength(32);
  });

  it('follows the hour through the headlight and tail-light colours', () => {
    const night = expoModel(atmFor('expo', 22));
    expect(night?.colors).not.toEqual(model?.colors);
    expect(night?.colors).toHaveLength(model?.colors.length ?? 0);
  });

  it('is nothing for another look', () => {
    expect(expoModel(atmFor('golden', 18.12))).toBeNull();
  });
});

describe('car motion', () => {
  it('starts a car part-way along when its delay is negative, and wraps', () => {
    const car = { durationMs: 3000, delayMs: -1500 };
    expect(carProgress(car, 0)).toBeCloseTo(0.5);
    expect(carProgress(car, 1500)).toBeCloseTo(0);
    expect(carProgress(car, 3000)).toBeCloseTo(0.5);
  });

  it('crosses from −300 to 720 heading right and back heading left', () => {
    expect(carOffset(1, 0)).toBe(-300);
    expect(carOffset(1, 1)).toBe(720);
    expect(carOffset(-1, 0)).toBe(720);
    expect(carOffset(-1, 1)).toBe(-300);
  });
});
