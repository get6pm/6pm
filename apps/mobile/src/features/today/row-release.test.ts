import { describe, expect, it } from '@jest/globals';

import { ROW_STOP, rowOffset, rowRelease } from './row-release';

describe('rowRelease', () => {
  it('reads a slow release by distance alone', () => {
    expect(rowRelease(-160, 0, true)).toBe('delete');
    expect(rowRelease(-100, 0, true)).toBe('reveal');
    expect(rowRelease(-30, 0, true)).toBe('home');
    expect(rowRelease(100, 0, true)).toBe('confirm');
    expect(rowRelease(60, 0, true)).toBe('home');
  });

  it('lets a quick flick commit short of the threshold', () => {
    expect(rowRelease(-60, -1200, true)).toBe('delete');
    expect(rowRelease(40, 800, true)).toBe('confirm');
    expect(rowRelease(-20, -400, true)).toBe('reveal');
  });

  it('does not delete on an ordinary quick release near home', () => {
    expect(rowRelease(-20, -800, true)).toBe('reveal');
    expect(rowRelease(-10, -300, true)).toBe('home');
  });

  it('takes back a commit the finger reversed before letting go', () => {
    expect(rowRelease(-170, 600, true)).toBe('reveal');
    expect(rowRelease(110, -900, true)).toBe('home');
    expect(rowRelease(-60, 900, true)).toBe('home');
  });

  it('only commits on the side the row was dragged to', () => {
    expect(rowRelease(30, -3000, true)).toBe('home');
    expect(rowRelease(-30, 3000, true)).toBe('home');
  });

  it('never confirms a row with nothing to confirm', () => {
    expect(rowRelease(150, 0, false)).toBe('home');
    expect(rowRelease(20, 2000, false)).toBe('home');
  });
});

describe('rowOffset', () => {
  it('follows the finger one to one between the stops', () => {
    expect(rowOffset(-200, true)).toBe(-200);
    expect(rowOffset(150, true)).toBe(150);
  });

  it('gives like rubber past the stops instead of stopping dead', () => {
    const left = rowOffset(ROW_STOP.left - 100, true);
    expect(left).toBeLessThan(ROW_STOP.left);
    expect(left).toBeGreaterThan(ROW_STOP.left - 60);
    const right = rowOffset(ROW_STOP.right + 100, true);
    expect(right).toBeGreaterThan(ROW_STOP.right);
    expect(right).toBeLessThan(ROW_STOP.right + 60);
  });

  it('barely moves right when there is nothing to confirm', () => {
    expect(rowOffset(100, false)).toBeLessThan(40);
    expect(rowOffset(100, false)).toBeGreaterThan(0);
  });
});
