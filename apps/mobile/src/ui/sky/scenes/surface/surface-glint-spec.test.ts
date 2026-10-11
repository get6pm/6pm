import { describe, expect, it } from '@jest/globals';

import { atmosphereFor, paletteFor, type FrameInput } from '@6pm/theme';

import { parseGlints } from './surface-glint-spec';

const input = (look: FrameInput['look'], hour: number): FrameInput => ({
  look,
  hour,
  serious: false,
});
const glintsOf = (look: FrameInput['look'], hour: number) => {
  const i = input(look, hour);
  return parseGlints(atmosphereFor(i, paletteFor(i), 1).glints);
};

describe('parseGlints', () => {
  it('reads Sơn Mài’s 28 gold-leaf flakes with a one-shadow glow each', () => {
    const { shapes, glow } = glintsOf('lacquer', 14);
    expect(shapes).toHaveLength(28);
    expect(glow).toHaveLength(28 * 4);
    const first = shapes[0]!;
    expect(first.fill.colors).toHaveLength(3);
    expect(first.fill.angleDeg).toBe(135);
    expect(first.shadows).toEqual([{ blur: 6, spread: 0 }]);
    expect(first.radius).toBe(1);
    expect(first.delayMs).toBeLessThanOrEqual(0);
  });

  it('reads Holo Foil’s 16 white sparkles turned 45 degrees, with two glows', () => {
    const { shapes, glow } = glintsOf('holo', 14);
    expect(shapes).toHaveLength(16);
    expect(glow).toHaveLength(16 * 2 * 4);
    expect(shapes[0]?.rotation).toBeCloseTo(Math.PI / 4);
    expect(shapes[0]?.fill.colors).toEqual([[1, 1, 1, 1]]);
    expect(shapes[0]?.shadows.map((s) => s.blur)).toEqual([6, 14]);
    expect(shapes[1]?.glowAt).toBe(8);
  });

  it('keeps the flakes where they are while the glow colour follows the hour', () => {
    const morning = glintsOf('holo', 8.5);
    const evening = glintsOf('holo', 21.5);
    expect(evening.shapes).toEqual(morning.shapes);
    expect(evening.glow).not.toEqual(morning.glow);
  });

  it('has none when the switch is off or the look has none', () => {
    expect(glintsOf('arcade', 14).shapes).toEqual([]);
    expect(parseGlints(undefined).shapes).toEqual([]);
  });
});
