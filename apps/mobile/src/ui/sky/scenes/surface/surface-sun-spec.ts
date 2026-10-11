/**
 * The sun of the surface looks, read from the look engine's `sunFx`: Holo Foil's conic disc, Sơn
 * Mài's off-centre metallic highlight, Arcade's striped gradient, and Riso's off-register ghost.
 * Structure (shapes, stop positions) is static per look; the numbers that move with the hour are
 * one flat array that tweens (see `SUN`).
 */

import { sunFor, type FrameInput, type Palette } from '@6pm/theme';

import {
  CLEAR,
  parseBoxShadows,
  parseColor,
  parseGradients,
  resolveStops,
  splitTopLevel,
  type ResolvedStops,
} from '../../css-values';
import { baseSun } from '../../sun-geometry';
import { isSurfaceLook, writeRgba } from './surface-css';

export type SunFill =
  /** The shared sun draws the disc (Riso: a flat ink). */
  | { readonly kind: 'none' }
  | {
      readonly kind: 'radial';
      readonly at: readonly [number, number];
      readonly positions: readonly number[];
    }
  | { readonly kind: 'linear'; readonly angleDeg: number; readonly positions: readonly number[] }
  | { readonly kind: 'conic'; readonly fromDeg: number; readonly positions: readonly number[] };

/** `mask-image`: the top `solid` fraction shows, below it `on` px of every `period` px. */
export interface StripeMask {
  readonly solid: number;
  readonly on: number;
  readonly period: number;
}

export interface SunShadow {
  readonly blur: number;
  readonly spread: number;
}

export interface SunShape {
  readonly fill: SunFill;
  /** Outer box-shadows, topmost first. */
  readonly shadows: readonly SunShadow[];
  readonly mask: StripeMask | null;
  /** The off-register copy's offset, in points, or null when the look has none. */
  readonly ghost: { readonly dx: number; readonly dy: number } | null;
}

/** Where each number sits in `SunFrame.values`; fill colours follow, then shadow colours. */
export const SUN = { x: 0, y: 1, size: 2, opacity: 3, ghostOp: 4, ghostColor: 5, fill: 9 } as const;

export interface SunFrame {
  readonly shape: SunShape;
  readonly values: readonly number[];
}

function conic(css: string): { fromDeg: number; stops: ResolvedStops } | null {
  const m = /^conic-gradient\(\s*from\s+(-?[\d.]+)deg\s*,(.*)\)$/s.exec(css.trim());
  if (!m?.[1] || m[2] === undefined) return null;
  const colors = splitTopLevel(m[2]).map(parseColor);
  if (colors.length < 2 || colors.some((c) => c === null)) return null;
  const stops = resolveStops(colors.map((color) => ({ color: color ?? CLEAR, at: null })));
  return { fromDeg: Number(m[1]), stops };
}

/** Reads the `mask-image` the prototype gives Arcade's sun (a solid top half over stripes). */
export function stripeMask(css: string): StripeMask | null {
  const half = /(?<![-\w])linear-gradient\(#000 0 ([\d.]+)%,\s*transparent \1%\)/.exec(css);
  const stripes =
    /repeating-linear-gradient\(180deg,\s*#000 0 ([\d.]+)px,\s*transparent \1px ([\d.]+)px\)/.exec(
      css,
    );
  if (!stripes?.[1] || !stripes[2]) return null;
  return {
    solid: half?.[1] ? Number(half[1]) / 100 : 0,
    on: Number(stripes[1]),
    period: Number(stripes[2]),
  };
}

function fillOf(css: string): { fill: SunFill; stops: ResolvedStops | null } {
  const spun = conic(css);
  if (spun) {
    return {
      fill: { kind: 'conic', fromDeg: spun.fromDeg, positions: spun.stops.positions },
      stops: spun.stops,
    };
  }
  const g = parseGradients(css)[0];
  if (g) {
    const stops = resolveStops(g.stops);
    return {
      fill:
        g.kind === 'linear'
          ? { kind: 'linear', angleDeg: g.angleDeg, positions: stops.positions }
          : { kind: 'radial', at: g.at, positions: stops.positions },
      stops,
    };
  }
  return { fill: { kind: 'none' }, stops: null };
}

const length = (v: unknown): number => parseFloat(String(v)) || 0;

export interface SunInput extends FrameInput {
  readonly showSun: boolean;
}

/**
 * The surface sun at an hour, or null when the look has none of its own (or in serious mode).
 * Riso's disc is the shared sun's, so only its ghost is described.
 */
export function sunFrame(input: SunInput, palette: Palette): SunFrame | null {
  if (!isSurfaceLook(input.look) || input.serious) return null;
  const sun = sunFor(input, palette, baseSun(input.hour, palette, input.showSun, input.serious));
  const color = typeof sun.color === 'string' ? sun.color : 'none';
  const { fill, stops } =
    input.look === 'riso' ? { fill: { kind: 'none' } as SunFill, stops: null } : fillOf(color);
  const shadows = parseBoxShadows(typeof sun.glow === 'string' ? sun.glow : 'none').filter(
    (s) => !s.inset && fill.kind !== 'none',
  );
  const mask = typeof sun.mask === 'string' ? stripeMask(sun.mask) : null;
  const ghost = input.look === 'riso' ? { dx: length(sun.gx), dy: length(sun.gy) } : null;
  const ghostColor = parseColor(typeof sun.ghost === 'string' ? sun.ghost : '') ?? CLEAR;

  const values: number[] = [
    Number(sun.x) || 0,
    Number(sun.y) || 0,
    Number(sun.size) || 0,
    Number(sun.opacity) || 0,
    Number(sun.ghostOp) || 0,
  ];
  writeRgba(values, ghostColor);
  stops?.colors.forEach((c) => writeRgba(values, c));
  shadows.forEach((s) => writeRgba(values, s.color));

  return {
    shape: { fill, shadows: shadows.map(({ blur, spread }) => ({ blur, spread })), mask, ghost },
    values,
  };
}

/** The offset of the shadow colours in `values` for a shape. */
export const shadowOffset = (shape: SunShape): number =>
  SUN.fill + (shape.fill.kind === 'none' ? 0 : 4 * shape.fill.positions.length);

/** The colour at `t` (0-1) along piecewise-linear stops. */
function sampleStops(colors: readonly number[][], positions: readonly number[], t: number) {
  'worklet';
  const last = colors.length - 1;
  if (t <= (positions[0] ?? 0)) return colors[0] ?? [0, 0, 0, 0];
  for (let i = 1; i <= last; i++) {
    const b = positions[i] ?? 1;
    if (t > b) continue;
    const a = positions[i - 1] ?? 0;
    const k = b > a ? (t - a) / (b - a) : 1;
    const from = colors[i - 1] ?? [0, 0, 0, 0];
    const to = colors[i] ?? from;
    return from.map((v, c) => v + ((to[c] ?? v) - v) * k);
  }
  return colors[last] ?? [0, 0, 0, 0];
}

/** The ranges (in points from the top of a `size` box) where `mask` shows. */
export function maskRuns(size: number, mask: StripeMask): [number, number][] {
  'worklet';
  const solid = Math.min(size, mask.solid * size);
  const runs: [number, number][] = solid > 0 ? [[0, solid]] : [];
  for (let start = 0; start < size; start += mask.period) {
    const end = Math.min(start + mask.on, size);
    if (end <= solid) continue;
    const from = Math.max(start, solid);
    const last = runs[runs.length - 1];
    if (last && from <= last[1]) last[1] = Math.max(last[1], end);
    else runs.push([from, end]);
  }
  return runs;
}

/**
 * A top-to-bottom gradient with `mask` baked in: the fill's own stops inside the visible runs and
 * hard-edged clear gaps between them, so the sun needs no mask layer.
 */
export function maskedStops(
  colors: readonly number[][],
  positions: readonly number[],
  size: number,
  mask: StripeMask,
): { colors: number[][]; positions: number[] } {
  'worklet';
  const outColors: number[][] = [];
  const outAt: number[] = [];
  const clear = [0, 0, 0, 0];
  const runs = maskRuns(size, mask);
  let end = 0;
  for (let r = 0; r < runs.length; r++) {
    const run = runs[r];
    if (!run) continue;
    const from = run[0] / size;
    const to = run[1] / size;
    if (r > 0) {
      outColors.push(clear, clear);
      outAt.push(end, from);
    }
    outColors.push(sampleStops(colors, positions, from));
    outAt.push(from);
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i] ?? 0;
      if (p > from && p < to) {
        outColors.push(colors[i] ?? clear);
        outAt.push(p);
      }
    }
    outColors.push(sampleStops(colors, positions, to));
    outAt.push(to);
    end = to;
  }
  if (outAt.length === 0) return { colors: [clear, clear], positions: [0, 1] };
  if (end < 1) {
    outColors.push(clear, clear);
    outAt.push(end, 1);
  }
  return { colors: outColors, positions: outAt };
}
