import { describe, expect, it } from '@jest/globals';

import { paletteFor } from '@6pm/theme';

import { parseColor } from './css-values';
import { skyFrame } from './sky-frame';
import { SLOT } from './sky-slots';

const color = (v: readonly number[], at: number) => v.slice(at, at + 4);
const hex = (h: string) => [...(parseColor(h) ?? [])];
const friday = { look: 'golden', hour: 18.12, serious: false, showSun: true } as const;

describe('skyFrame', () => {
  it('paints the designed Friday with the palette’s exact sky stops', () => {
    const { values } = skyFrame(friday);
    const { st } = paletteFor(friday);
    expect(color(values, SLOT.sky)).toEqual(hex(st[0]));
    expect(color(values, SLOT.sky + 4)).toEqual(hex(st[1]));
    expect(color(values, SLOT.sky + 8)).toEqual(hex(st[2]));
  });

  it('screens the blooms after dark and multiplies them by day', () => {
    const night = skyFrame(friday);
    expect(night.layout.bloomBlend).toBe('screen');
    expect(night.values[SLOT.bloomOp]).toBeCloseTo(0.62);
    const day = skyFrame({ ...friday, hour: 14 });
    expect(day.layout.bloomBlend).toBe('multiply');
    expect(day.values[SLOT.bloomOp]).toBeCloseTo(0.34);
  });

  it('carries the sun, its rings and halo, and a dusk-weighted flare', () => {
    const { values } = skyFrame(friday);
    expect(values[SLOT.sunOp]).toBe(1);
    expect(values[SLOT.sunFocusY]).toBeCloseTo(0.38);
    expect(values[SLOT.ringSpread]).toBe(12);
    expect(values[SLOT.haloSigma]).toBe(75);
    expect(values[SLOT.haloSpread]).toBe(70);
    expect(values[SLOT.streakOp]).toBeGreaterThan(0.5);
  });

  it('brings in bokeh after 18:36 and the moon after 19:00', () => {
    expect(skyFrame(friday).values[SLOT.bokehOp]).toBe(0);
    const late = skyFrame({ ...friday, hour: 21.5 });
    expect(late.values[SLOT.bokehOp]).toBe(1);
    expect(late.values[SLOT.moonOp]).toBe(1);
    expect(late.values[SLOT.sunOp]).toBe(0);
    expect(late.layout.bokeh).toHaveLength(7);
    expect(late.layout.bokeh[0]).toMatchObject({ x: 0.12, y: 318, size: 18, periodMs: 3400 });
  });

  it('keeps Basic to the system: a flat sky, no grain, and a sun only when asked for', () => {
    const basic = skyFrame({ look: 'basic', hour: 14, serious: false, showSun: true });
    expect(basic.values[SLOT.bloomOp]).toBe(0);
    expect(basic.values[SLOT.leakOp]).toBe(0);
    expect(basic.layout.leaks).toHaveLength(0);
    expect(basic.values[SLOT.grainOp]).toBe(0);
    expect(basic.values[SLOT.sunOp]).toBe(0);
    expect(basic.values[SLOT.vignette + 3]).toBe(0);
    expect(color(basic.values, SLOT.sky)).toEqual(color(basic.values, SLOT.sky + 8));
    const marked = skyFrame({
      look: 'basic',
      config: { sun: true },
      hour: 14,
      serious: false,
      showSun: true,
    });
    expect(marked.values[SLOT.sunSize]).toBe(14);
    expect(marked.values[SLOT.sunOp]).toBe(1);
  });

  it('turns slate with only grain in serious mode', () => {
    const { values } = skyFrame({ ...friday, serious: true });
    expect(color(values, SLOT.sky)).toEqual(hex('#2b2f37'));
    expect(values[SLOT.sunOp]).toBe(0);
    expect(values[SLOT.moonOp]).toBe(0);
    for (const slot of [SLOT.bloomOp, SLOT.streakOp, SLOT.dotOp, SLOT.leakOp, SLOT.bokehOp]) {
      expect(values[slot]).toBe(0);
    }
    expect(values[SLOT.grainOp]).toBe(0.16);
  });

  it('hides the sun off the Today tab, and the flare with it', () => {
    const { values } = skyFrame({ ...friday, showSun: false });
    expect(values[SLOT.sunOp]).toBe(0);
    expect(values[SLOT.streakOp]).toBe(0);
  });
});
