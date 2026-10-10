import { describe, expect, it } from '@jest/globals';

import {
  clampPosition,
  columnOffset,
  edgeFade,
  momentumIndex,
  rowAt,
  rowLook,
  rubberBand,
  wheelRowHeight,
} from './wheel-maths';

describe('wheel maths', () => {
  it('sizes rows at 1.4× the type, rounded like the prototype', () => {
    expect(wheelRowHeight(28)).toBe(39);
    expect(wheelRowHeight(38)).toBe(53);
    expect(wheelRowHeight(52)).toBe(73);
  });

  it('follows the finger freely between the ends and at 0.3× past them', () => {
    expect(rubberBand(4.5, 10)).toBe(4.5);
    expect(rubberBand(-2, 10)).toBeCloseTo(-0.6);
    expect(rubberBand(11, 10)).toBeCloseTo(9.6);
    expect(clampPosition(-0.6, 10)).toBe(0);
    expect(clampPosition(9.6, 10)).toBe(9);
  });

  it('settles a release where 220 ms of its velocity would carry it', () => {
    // Still finger: the nearest row.
    expect(momentumIndex(3.4, 0, 39, 31)).toBe(3);
    // An upward flick at 1 pt/ms over 39 pt rows travels 220/39 ≈ 5.6 rows forward.
    expect(momentumIndex(3, -1, 39, 31)).toBe(9);
    // A hard downward flick stops at the first row.
    expect(momentumIndex(3, 4, 39, 31)).toBe(0);
    expect(momentumIndex(28, -4, 39, 31)).toBe(30);
  });

  it('finds the tapped row and centres the chosen one', () => {
    // Three rows of 39 pt showing rows 4, 5, 6: the top row is 4, the bottom 6.
    expect(rowAt(10, 5, 39, 3, 31)).toBe(4);
    expect(rowAt(58, 5, 39, 3, 31)).toBe(5);
    expect(rowAt(110, 5, 39, 3, 31)).toBe(6);
    expect(rowAt(10, 0, 39, 3, 31)).toBe(0);
    expect(columnOffset(5, 39, 3)).toBe(39 - 5 * 39);
  });

  it('fades, shrinks and tilts rows with distance, up to three rows', () => {
    expect(rowLook(0)).toEqual({ opacity: 1, scale: 1, rotateX: 0 });
    const above = rowLook(-1);
    expect(above.opacity).toBeCloseTo(0.64);
    expect(above.scale).toBeCloseTo(0.93);
    expect(above.rotateX).toBe(22);
    expect(rowLook(1).rotateX).toBe(-22);
    expect(rowLook(5)).toEqual(rowLook(3));
    expect(rowLook(3).opacity).toBe(0.1);
  });

  it('fades the top and bottom third of the wheel', () => {
    expect(edgeFade(0)).toBe(0);
    expect(edgeFade(0.17)).toBeCloseTo(0.5);
    expect(edgeFade(0.5)).toBe(1);
    expect(edgeFade(1)).toBe(0);
  });
});
