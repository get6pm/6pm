import { describe, expect, it } from '@jest/globals';

import { paletteFor } from '@6pm/theme';

import { paperSunModel, SUN_VALUE } from './paper-sun-model';

const at = (hour: number, extra: { showSun?: boolean; look?: 'paper' | 'golden' } = {}) => {
  const frame = { look: extra.look ?? 'paper', hour, serious: false } as const;
  return paperSunModel({ ...frame, palette: paletteFor(frame), showSun: extra.showSun ?? true });
};

describe('paperSunModel', () => {
  it('hangs a paper disc on a thread, lit off to the upper left', () => {
    const sun = at(14);
    expect(sun.focus).toEqual({ x: 0.4, y: 0.35 });
    expect(sun.bodyAt).toBeCloseTo(0.7);
    expect(sun.values[SUN_VALUE.opacity]).toBe(1);
    expect(sun.values[SUN_VALUE.threadOpacity]).toBe(1);
    expect(sun.values[SUN_VALUE.thread + 3]).toBeCloseTo(0.45);
  });

  it('casts a soft shadow ten points down and shades a crescent on the lower right', () => {
    const sun = at(14);
    expect(sun.cast.dy).toBe(10);
    expect(sun.cast.sigma).toBe(8);
    expect(sun.cast.color[3]).toBeCloseTo(0.22);
    expect(sun.crescent).toMatchObject({ dx: -5, dy: -7 });
    expect(sun.crescent.color[3]).toBeCloseTo(0.08);
  });

  it('follows the day’s arc and sets by 19:06', () => {
    const noon = at(12.25);
    const evening = at(17);
    expect(noon.values[SUN_VALUE.y]).toBeLessThan(evening.values[SUN_VALUE.y] ?? 0);
    expect(noon.values[SUN_VALUE.size]).toBe(60);
    expect(evening.values[SUN_VALUE.size]).toBeCloseTo(84);
    expect(at(19.2).values[SUN_VALUE.opacity]).toBe(0);
  });

  it('is gone off the Today tab and for any other look', () => {
    expect(at(14, { showSun: false }).values[SUN_VALUE.opacity]).toBe(0);
    expect(at(14, { look: 'golden' }).values.every((v) => v === 0)).toBe(true);
  });
});
