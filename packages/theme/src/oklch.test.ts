import { describe, expect, it } from 'vitest';

import { categoryTile, oklch, oklchSrgbHex } from './oklch';

describe('oklch', () => {
  it('converts in-gamut colours to sRGB hex', () => {
    expect(oklch(1, 0, 0)).toBe('#ffffff');
    expect(oklch(0, 0, 0)).toBe('#000000');
  });

  // Ground truth: Chromium painting the same oklch() on an sRGB canvas.
  it.each([
    [0.66, 0.14, 150, '#47aa62'],
    [0.7, 0.15, 45, '#e97c48'],
    [0.9, 0.07, 45, '#ffd0b8'],
    [0.78, 0.12, 45, '#f79e75'],
    [0.34, 0.09, 45, '#5c2507'],
    [0.9, 0.07, 245, '#b8e4ff'],
    [0.78, 0.12, 300, '#c3a5f9'],
    [0.34, 0.09, 350, '#59213e'],
  ])('oklch(%d %d %d) clips to %s like the browser', (l, c, h, hex) => {
    expect(oklchSrgbHex(l, c, h)).toBe(hex);
  });

  it('keeps out-of-sRGB colours wide, in Display P3', () => {
    expect(oklch(0.7, 0.3, 30)).toMatch(/^color\(display-p3 /);
  });

  it('builds category tiles from a hue', () => {
    const food = categoryTile(45);
    expect(food.glyph).toMatch(/^#|^color\(/);
    expect(food.from).not.toBe(food.to);
  });
});
