import { atmosphereFor, paletteFor, sunFor, type FrameInput, type Palette } from '@6pm/theme';

import { bloomProfile, type RadialProfile } from './blur-profile';
import {
  CLEAR,
  parseBlur,
  parseBoxShadows,
  parseColor,
  parseGradients,
  resolveStops,
  type GradientValue,
  type RadialGradientValue,
  type ResolvedStops,
  type Rgba,
} from './css-values';
import {
  LEAK_STOPS,
  MAX_BOKEH,
  MAX_LEAKS,
  SLOT,
  STREAK_STOPS,
  SUN_RINGS,
  SUN_STOPS,
  writeColor,
} from './sky-slots';
import { baseSun, moonOpacity } from './sun-geometry';

/** The CSS blend modes the atmosphere uses, by their Skia names. */
export type SkyBlend = 'srcOver' | 'screen' | 'multiply' | 'overlay';

const blendOf = (css: unknown): SkyBlend =>
  css === 'screen' || css === 'multiply' || css === 'overlay' ? css : 'srcOver';

/** A gradient's geometry, whose colours live in the animated slots. */
export type LeakShape =
  | { readonly kind: 'linear'; readonly angleDeg: number; readonly at: readonly number[] }
  | {
      readonly kind: 'radial';
      readonly value: RadialGradientValue;
      readonly at: readonly number[];
    };

export interface BokehSpot {
  /** Top-left corner: x as a fraction of the width, y in points. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** Standard deviation of its glow (`box-shadow: 0 0 <size>px`). */
  readonly glowSigma: number;
  readonly periodMs: number;
}

/** What the sky draws that does not tween: shapes, blend modes, blur profiles. */
export interface SkyLayout {
  readonly bloomBlend: SkyBlend;
  /** The three blooms' blurred alpha profiles (440 pt, 400 pt and 300 pt circles). */
  readonly blooms: readonly [RadialProfile, RadialProfile, RadialProfile];
  readonly streakAt: readonly number[];
  readonly dotBlend: SkyBlend;
  /** Halftone cell, in points. */
  readonly dotCell: number;
  readonly leaks: readonly LeakShape[];
  readonly vignette: { readonly value: RadialGradientValue; readonly at: readonly number[] };
  readonly bokeh: readonly BokehSpot[];
  readonly grainBlend: SkyBlend;
}

export interface SkyFrame {
  readonly values: number[];
  readonly layout: SkyLayout;
  /** The hour's palette and atmosphere, for the looks' own layers (`scenes/`). */
  readonly palette: Palette;
  readonly atm: Readonly<Record<string, unknown>>;
}

export interface SkyInput extends FrameInput {
  /** Whether the sun belongs on this screen (the prototype shows it on Today only). */
  readonly showSun: boolean;
}

const BLOOM_SIZES = [440, 400, 300] as const;

const DEFAULT_VIGNETTE: RadialGradientValue = {
  kind: 'radial',
  size: { rx: 1.3, ry: 0.95 },
  at: [0.5, 0.38],
  stops: [
    { color: CLEAR, at: 0.48 },
    { color: CLEAR, at: 1 },
  ],
};

const text = (a: Record<string, unknown>, key: string): string => {
  const v = a[key];
  return typeof v === 'string' ? v : 'none';
};
const number = (a: Record<string, unknown>, key: string): number => {
  const v = a[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

/** Pads or trims stops to exactly `count`, repeating the last one. */
function fixedStops(stops: ResolvedStops, count: number): ResolvedStops {
  const colors = Array.from(
    { length: count },
    (_, i) => stops.colors[i] ?? stops.colors.at(-1) ?? CLEAR,
  );
  const positions = Array.from({ length: count }, (_, i) => stops.positions[i] ?? 1);
  return { colors, positions };
}

function firstRadial(css: string): RadialGradientValue | null {
  return parseGradients(css).find((g): g is RadialGradientValue => g.kind === 'radial') ?? null;
}

function bloom(css: string, size: number, sigma: number): { color: Rgba; profile: RadialProfile } {
  const g = firstRadial(css);
  const stops = g ? resolveStops(g.stops) : { colors: [CLEAR], positions: [0] };
  const color = stops.colors[0] ?? CLEAR;
  const alphas = stops.colors.map((c) => c[3]);
  return { color, profile: bloomProfile(size, { positions: stops.positions, alphas }, sigma) };
}

function writeSun(v: number[], input: SkyInput, palette: ReturnType<typeof paletteFor>) {
  const sun = sunFor(input, palette, baseSun(input.hour, palette, input.showSun, input.serious));
  const disc = typeof sun.color === 'string' ? sun.color : 'none';
  const radial = firstRadial(disc);
  const flat = parseColor(disc);
  const stops = radial
    ? fixedStops(resolveStops(radial.stops), SUN_STOPS)
    : fixedStops({ colors: [flat ?? CLEAR], positions: [0] }, SUN_STOPS);
  v[SLOT.sunX] = sun.x;
  v[SLOT.sunY] = sun.y;
  v[SLOT.sunSize] = sun.size;
  v[SLOT.sunOp] = radial || flat ? Number(sun.opacity) || 0 : 0;
  v[SLOT.sunFocusY] = radial?.at[1] ?? 0.5;
  stops.colors.forEach((c, i) => writeColor(v, SLOT.sunStops + 4 * i, c));
  stops.positions.forEach((p, i) => (v[SLOT.sunStopAt + i] = p));

  const shadows = parseBoxShadows(typeof sun.glow === 'string' ? sun.glow : 'none');
  const rings = shadows.filter((s) => !s.inset && s.blur === 0).slice(0, SUN_RINGS);
  rings.forEach((ring, i) => {
    writeColor(v, SLOT.rings + 4 * i, ring.color);
    v[SLOT.ringSpread + i] = ring.spread;
  });
  const halo = shadows.find((s) => !s.inset && s.blur > 0);
  if (halo) {
    writeColor(v, SLOT.halo, halo.color);
    v[SLOT.haloSigma] = halo.blur / 2;
    v[SLOT.haloSpread] = halo.spread;
  }
}

function leakShape(g: GradientValue): LeakShape {
  const at = fixedStops(resolveStops(g.stops), LEAK_STOPS).positions;
  return g.kind === 'linear'
    ? { kind: 'linear', angleDeg: g.angleDeg, at }
    : { kind: 'radial', value: g, at };
}

function bokehSpots(raw: unknown): { spot: BokehSpot; color: Rgba }[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_BOKEH).flatMap((b: Record<string, unknown>) => {
    const color = parseColor(String(b.c));
    const glow = parseBoxShadows(String(b.glow))[0];
    if (!color) return [];
    const spot = {
      x: parseFloat(String(b.l)) / 100,
      y: parseFloat(String(b.t)),
      size: parseFloat(String(b.s)),
      glowSigma: (glow?.blur ?? 0) / 2,
      periodMs: parseFloat(String(b.d)) * 1000,
    };
    return [{ spot, color }];
  });
}

/**
 * One frame of the sky at an hour: the look engine's palette, sun and atmosphere for that hour,
 * read into the tweenable slot values plus the layout that stays put.
 */
export function skyFrame(input: SkyInput): SkyFrame {
  const palette = paletteFor(input);
  const v = new Array<number>(SLOT.length).fill(0);

  const sky = parseGradients(palette.sky).find((g) => g.kind === 'linear');
  const skyStops = fixedStops(sky ? resolveStops(sky.stops) : { colors: [], positions: [] }, 3);
  skyStops.colors.forEach((c, i) => writeColor(v, SLOT.sky + 4 * i, c));

  writeSun(v, input, palette);
  const sunOpacity = v[SLOT.sunOp] ?? 0;
  const atm = atmosphereFor(input, palette, sunOpacity);

  const sigmaA = parseBlur(text(atm, 'blurA'));
  const sigmaB = parseBlur(text(atm, 'blurB'));
  const a = bloom(text(atm, 'bloomA'), BLOOM_SIZES[0], sigmaA);
  const b = bloom(text(atm, 'bloomB'), BLOOM_SIZES[1], sigmaB);
  const c = bloom(text(atm, 'bloomB'), BLOOM_SIZES[2], sigmaB);
  writeColor(v, SLOT.bloomA, a.color);
  writeColor(v, SLOT.bloomB, b.color);
  v[SLOT.bloomOp] = number(atm, 'bloomOp');

  const streak = parseGradients(text(atm, 'streak')).find((g) => g.kind === 'linear');
  const streakStops = fixedStops(
    streak ? resolveStops(streak.stops) : { colors: [], positions: [] },
    STREAK_STOPS,
  );
  streakStops.colors.forEach((col, i) => writeColor(v, SLOT.streak + 4 * i, col));
  v[SLOT.streakOp] = number(atm, 'streakOp');
  v[SLOT.streakSoft] = number(atm, 'streakSoft');

  v[SLOT.moonOp] = moonOpacity(input);

  const bokeh = bokehSpots(atm.bokeh);
  bokeh.forEach(({ color }, i) => writeColor(v, SLOT.bokeh + 4 * i, color));
  v[SLOT.bokehOp] = number(atm, 'bokehOp');

  writeColor(v, SLOT.dot, parseColor(text(atm, 'dot')) ?? CLEAR);
  v[SLOT.dotOp] = number(atm, 'dotOp');

  const leaks = parseGradients(text(atm, 'leak')).slice(0, MAX_LEAKS);
  leaks.forEach((g, i) => {
    const stops = fixedStops(resolveStops(g.stops), LEAK_STOPS);
    stops.colors.forEach((col, k) => writeColor(v, SLOT.leak + 4 * (i * LEAK_STOPS + k), col));
  });
  v[SLOT.leakOp] = number(atm, 'leakOp');

  const vignette = firstRadial(text(atm, 'vignette'));
  const vignetteStops = resolveStops((vignette ?? DEFAULT_VIGNETTE).stops);
  writeColor(v, SLOT.vignette, vignetteStops.colors.at(-1) ?? CLEAR);

  v[SLOT.grainOp] = number(atm, 'grainOp');

  const layout: SkyLayout = {
    bloomBlend: blendOf(atm.blend),
    blooms: [a.profile, b.profile, c.profile],
    streakAt: streakStops.positions,
    dotBlend: blendOf(atm.dotBlend),
    dotCell: parseFloat(text(atm, 'dotSize')) || 5,
    leaks: leaks.map(leakShape),
    vignette: {
      value: vignette ?? DEFAULT_VIGNETTE,
      at: fixedStops(vignetteStops, 2).positions,
    },
    bokeh: bokeh.map(({ spot }) => spot),
    grainBlend: blendOf(atm.grainBlend),
  };
  return { values: v, layout, palette, atm };
}
