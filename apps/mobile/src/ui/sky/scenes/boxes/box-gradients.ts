/**
 * A box's gradients as Skia draws them: the geometry of each CSS gradient over a box of known size,
 * and its stops as colours and positions (0–1). Pure, so the conversions are tested.
 */

import { linearGradientLine, type Point } from '../../css-geometry';
import type { Rgba } from '../../css-values';
import { resolveLen, type Gradient, type Stop } from './box-css';

export interface StopsOut {
  readonly colors: readonly Rgba[];
  readonly positions: readonly number[];
}

/**
 * Stop positions as fractions of `length` (px and % alike), implicit ones spread evenly as CSS
 * does, each never before the one before it. Conic degrees use `exp` for `var(--exp)`.
 */
export function resolveStops(stops: readonly Stop[], length: number, exp = 1): StopsOut {
  const at = stops.map((s): number | null => {
    if (!s.at) return null;
    if (s.at.kind === 'deg') return (s.at.k * exp + s.at.c) / 360;
    return s.at.len.unit === '%' ? s.at.len.v / 100 : length > 0 ? s.at.len.v / length : 0;
  });
  if (at[0] === null) at[0] = 0;
  if (at[at.length - 1] === null) at[at.length - 1] = 1;
  for (let i = 1; i < at.length; i++) {
    if (at[i] !== null) continue;
    let j = i;
    while (at[j] === null) j++;
    const from = at[i - 1] ?? 0;
    const to = at[j] ?? 1;
    for (let k = i; k < j; k++) at[k] = from + ((to - from) * (k - i + 1)) / (j - i + 1);
  }
  let floor = -Infinity;
  const positions = at.map((p) => (floor = Math.max(floor, p ?? 0)));
  return { colors: stops.map((s) => s.color), positions };
}

export type GradientGeometry =
  | {
      readonly kind: 'linear';
      readonly start: Point;
      readonly end: Point;
      readonly stops: StopsOut;
      readonly repeat: boolean;
    }
  | {
      readonly kind: 'radial';
      readonly c: Point;
      readonly rx: number;
      readonly ry: number;
      readonly stops: StopsOut;
    }
  | {
      readonly kind: 'conic';
      readonly c: Point;
      readonly fromDeg: number;
      readonly stops: readonly Stop[];
    };

/** Where a gradient sits over a w×h box (its tile, for a sized background layer). */
export function gradientGeometry(g: Gradient, w: number, h: number): GradientGeometry | null {
  switch (g.kind) {
    case 'linear': {
      const { start, end } = linearGradientLine(g.angleDeg, w, h);
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const stops = resolveStops(g.stops, length);
      if (!g.repeating) return { kind: 'linear', start, end, stops, repeat: false };
      // A repeating gradient repeats its own span: the line runs from the start for one period.
      const period = (stops.positions.at(-1) ?? 1) - (stops.positions[0] ?? 0);
      if (!(period > 0)) return null;
      const ux = (end.x - start.x) / length;
      const uy = (end.y - start.y) / length;
      const p0 = (stops.positions[0] ?? 0) * length;
      const span = period * length;
      return {
        kind: 'linear',
        start: { x: start.x + ux * p0, y: start.y + uy * p0 },
        end: { x: start.x + ux * (p0 + span), y: start.y + uy * (p0 + span) },
        stops: {
          colors: stops.colors,
          positions: stops.positions.map((p) => (p - (stops.positions[0] ?? 0)) / period),
        },
        repeat: true,
      };
    }
    case 'radial': {
      const c = { x: resolveLen(g.at[0], w), y: resolveLen(g.at[1], h) };
      const farX = Math.max(c.x, w - c.x);
      const farY = Math.max(c.y, h - c.y);
      let rx: number;
      let ry: number;
      switch (g.size.kind) {
        case 'circle':
          rx = ry = Math.hypot(farX, farY);
          break;
        case 'closest-side':
          rx = Math.min(c.x, w - c.x);
          ry = Math.min(c.y, h - c.y);
          break;
        case 'ellipse':
          // The farthest-corner ellipse keeps the box's aspect: √2 × the farthest sides.
          rx = farX * Math.SQRT2;
          ry = farY * Math.SQRT2;
          break;
        case 'lengths':
          rx = resolveLen(g.size.rx, w);
          ry = resolveLen(g.size.ry, h);
          break;
      }
      if (!(rx > 0) || !(ry > 0)) return null;
      return { kind: 'radial', c, rx, ry, stops: resolveStops(g.stops, rx) };
    }
    case 'conic':
      return {
        kind: 'conic',
        c: { x: resolveLen(g.at[0], w), y: resolveLen(g.at[1], h) },
        fromDeg: g.fromDeg,
        stops: g.stops,
      };
    case 'color':
    case 'noise':
      return null;
  }
}

/** Whether a conic's stops move with `--exp` (Long Exposure's star trails). */
export const exposes = (stops: readonly Stop[]): boolean =>
  stops.some((s) => s.at?.kind === 'deg' && s.at.k !== 0);
