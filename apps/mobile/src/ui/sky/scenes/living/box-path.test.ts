import { describe, expect, it } from '@jest/globals';

import { boxPath, parseBorderRadius } from './box-path';

describe('parseBorderRadius', () => {
  it('reads percentages of the box, horizontal against width and vertical against height', () => {
    const c = parseBorderRadius('50%', 100, 60);
    expect(c.tl).toEqual({ x: 50, y: 30 });
    expect(c.br).toEqual({ x: 50, y: 30 });
  });

  it('reads the slash form with four radii per axis', () => {
    const c = parseBorderRadius('46% 46% 42% 42% / 62% 62% 30% 30%', 100, 200);
    expect(c.tl).toEqual({ x: 46, y: 124 });
    expect(c.tr).toEqual({ x: 46, y: 124 });
    expect(c.br.x).toBe(42);
    expect(c.br.y).toBe(60);
    expect(c.bl.y).toBe(60);
  });

  it('expands two and three values as CSS does', () => {
    const two = parseBorderRadius('2px 4px', 50, 50);
    expect([two.tl.x, two.tr.x, two.br.x, two.bl.x]).toEqual([2, 4, 2, 4]);
    const three = parseBorderRadius('2px 4px 6px', 50, 50);
    expect([three.tl.x, three.tr.x, three.br.x, three.bl.x]).toEqual([2, 4, 6, 4]);
  });

  it('scales every radius down together when two would overlap', () => {
    const c = parseBorderRadius('80% 80%', 100, 100);
    expect(c.tl.x).toBeCloseTo(50);
    expect(c.tr.x).toBeCloseTo(50);
  });

  it('is square for zero', () => {
    expect(parseBorderRadius('0', 10, 10).tl).toEqual({ x: 0, y: 0 });
  });
});

describe('boxPath', () => {
  it('draws a plain rectangle without curves', () => {
    expect(boxPath(0, 0, 10, 5)).toBe('M0 0L10 0L10 5L0 5L0 0Z');
  });

  it('keeps every point of a rounded box inside it and starts each corner on its edge', () => {
    const corners = parseBorderRadius('50%', 100, 60);
    const d = boxPath(10, 20, 100, 60, corners);
    const numbers = (d.match(/-?[\d.]+/g) ?? []).map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThanOrEqual(10);
      expect(numbers[i]).toBeLessThanOrEqual(110);
      expect(numbers[i + 1]).toBeGreaterThanOrEqual(20);
      expect(numbers[i + 1]).toBeLessThanOrEqual(80);
    }
    expect(d.match(/C/g)).toHaveLength(4);
  });
});
