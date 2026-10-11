import { describe, expect, it } from '@jest/globals';

import { paletteFor, type FrameInput } from '@6pm/theme';

import {
  maskedStops,
  maskRuns,
  shadowOffset,
  stripeMask,
  sunFrame,
  SUN,
  type SunInput,
} from './surface-sun-spec';

const input = (
  look: FrameInput['look'],
  hour: number,
  extra: Partial<SunInput> = {},
): SunInput => ({
  look,
  hour,
  serious: false,
  showSun: true,
  ...extra,
});
const frameOf = (look: FrameInput['look'], hour: number, extra: Partial<SunInput> = {}) => {
  const i = input(look, hour, extra);
  return sunFrame(i, paletteFor(i));
};

describe('sunFrame', () => {
  it('reads Holo Foil’s conic disc with its two rings and halo', () => {
    const frame = frameOf('holo', 14);
    expect(frame?.shape.fill).toMatchObject({ kind: 'conic', fromDeg: 210 });
    expect(frame?.shape.fill).toHaveProperty('positions', [0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(frame?.shape.shadows).toEqual([
      { blur: 0, spread: 10 },
      { blur: 0, spread: 24 },
      { blur: 110, spread: 40 },
    ]);
    expect(frame?.values).toHaveLength(shadowOffset(frame!.shape) + 3 * 4);
  });

  it('reads Sơn Mài’s highlight at 36% / 30% of the disc', () => {
    const frame = frameOf('lacquer', 14);
    expect(frame?.shape.fill).toMatchObject({ kind: 'radial', at: [0.36, 0.3] });
    expect(frame?.shape.shadows).toEqual([
      { blur: 0, spread: 1 },
      { blur: 70, spread: 24 },
    ]);
  });

  it('reads Arcade’s two-stop disc and its striped mask, without a glow', () => {
    const frame = frameOf('arcade', 14);
    expect(frame?.shape.fill).toMatchObject({ kind: 'linear', angleDeg: 180 });
    expect(frame?.shape.mask).toEqual({ solid: 0.5, on: 7, period: 10 });
    expect(frame?.shape.shadows).toEqual([]);
  });

  it('describes only Riso’s off-register ghost, at 85% of the sun’s opacity', () => {
    const frame = frameOf('riso', 14);
    expect(frame?.shape).toMatchObject({ fill: { kind: 'none' }, ghost: { dx: 8, dy: -6 } });
    expect(frame?.values[SUN.ghostOp]).toBeCloseTo(0.85 * (frame?.values[SUN.opacity] ?? 0));
    const aligned = sunFrame(
      input('riso', 14, { config: { v: 0, k: 70, mis: false } }),
      paletteFor(input('riso', 14, { config: { v: 0, k: 70, mis: false } })),
    );
    expect(aligned?.values[SUN.ghostOp]).toBe(0);
  });

  it('has nothing for other looks, serious mode, or off the Today tab', () => {
    expect(frameOf('golden', 14)).toBeNull();
    expect(frameOf('holo', 14, { serious: true })).toBeNull();
    expect(frameOf('holo', 14, { showSun: false })?.values[SUN.opacity]).toBe(0);
  });

  it('keeps the same structure through the day so only numbers tween', () => {
    const morning = frameOf('holo', 8.5);
    const evening = frameOf('holo', 21.5);
    expect(evening?.shape).toEqual(morning?.shape);
    expect(evening?.values).toHaveLength(morning?.values.length ?? -1);
  });
});

describe('stripeMask', () => {
  it('reads the mask the prototype gives Arcade’s sun', () => {
    expect(
      stripeMask(
        'linear-gradient(#000 0 50%, transparent 50%), repeating-linear-gradient(180deg, #000 0 7px, transparent 7px 10px)',
      ),
    ).toEqual({ solid: 0.5, on: 7, period: 10 });
    expect(stripeMask('none')).toBeNull();
  });
});

describe('maskRuns', () => {
  it('shows the solid half, then 7 of every 10 points below it', () => {
    expect(maskRuns(60, { solid: 0.5, on: 7, period: 10 })).toEqual([
      [0, 37],
      [40, 47],
      [50, 57],
    ]);
  });

  it('keeps a gap when a stripe starts below the solid part, and clips the last stripe', () => {
    expect(maskRuns(54, { solid: 0.5, on: 7, period: 10 })[0]).toEqual([0, 27]);
    expect(maskRuns(64, { solid: 0.5, on: 7, period: 10 }).at(-1)).toEqual([60, 64]);
  });
});

describe('maskedStops', () => {
  const red = [1, 0, 0, 1];
  const blue = [0, 0, 1, 1];

  it('keeps the fill’s colours inside each run and cuts hard to clear between them', () => {
    const { colors, positions } = maskedStops([red, blue], [0, 1], 40, {
      solid: 0.5,
      on: 7,
      period: 10,
    });
    // Runs: 0-27 (the solid half and the stripe touching it), then 30-37.
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions[0]).toBe(0);
    expect(positions.at(-1)).toBe(1);
    expect(colors[0]).toEqual(red);
    // The run ends 27 of 40 points down, where the fill is 67.5% of the way to blue.
    const end = positions.indexOf(27 / 40);
    expect(colors[end]?.[2]).toBeCloseTo(27 / 40);
    expect(colors[end + 1]).toEqual([0, 0, 0, 0]);
  });
});
