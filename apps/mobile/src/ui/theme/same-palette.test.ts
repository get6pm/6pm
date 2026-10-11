import { describe, expect, it } from '@jest/globals';

import { paletteFor, type Palette } from '@6pm/theme';

import { samePalette } from './same-palette';

const at = (hour: number) => paletteFor({ look: 'golden', hour, serious: false });

describe('samePalette', () => {
  it('is true for the same palette computed twice', () => {
    expect(samePalette(at(9), at(9))).toBe(true);
  });

  it('is false once a colour moves, even only in the sky', () => {
    expect(samePalette(at(17), at(17.5))).toBe(false);
  });

  it('tells a light palette from a dark one', () => {
    expect(samePalette(at(9), at(23))).toBe(false);
  });

  it('compares the sky colours one by one', () => {
    const a = at(9);
    const copy = { ...a, st: [...a.st] as Palette['st'] };
    expect(samePalette(a, copy)).toBe(true);
    const moved = { ...a, st: [a.st[0], a.st[1], '#000000', a.st[3], a.st[4]] as Palette['st'] };
    expect(samePalette(a, moved)).toBe(false);
  });
});
