/**
 * Reads the CSS the look engine produces for the surface looks (Arcade, Holo Foil, Sơn Mài, Riso
 * Club) into shapes that stay put and numbers that tween with the hour, so every colour on screen
 * is the one the prototype computes. The sky and the blooms of these looks use forms the shared
 * parser leaves out (two-position stops: `color 0 34%`), so they are expanded here first.
 */

import type { LookId } from '@6pm/theme';

import {
  parseGradients,
  resolveStops,
  type RadialGradientValue,
  type Rgba,
} from '../../css-values';

/** What the controller must know about a look's own layers. */
export const SURFACE_LOOKS: readonly LookId[] = ['arcade', 'holo', 'lacquer', 'riso'];

export const isSurfaceLook = (look: LookId): boolean => SURFACE_LOOKS.includes(look);

/** Looks whose sky is not the shared three-stop gradient (bands, or a glow over the gradient). */
export const surfaceOwnsSky = (look: LookId): boolean =>
  look === 'arcade' || look === 'riso' || look === 'lacquer';

/** Looks whose sun the shared `SkySun` cannot draw (conic, striped, off-centre highlight). */
export const surfaceOwnsSun = (look: LookId): boolean =>
  look === 'arcade' || look === 'holo' || look === 'lacquer';

/** Looks whose blooms have hard edges, which the shared blooms leave out. */
export const surfaceOwnsBlooms = (look: LookId): boolean => look === 'riso';

type Bag = Readonly<Record<string, unknown>>;

export const textOf = (bag: Bag, key: string): string => {
  const v = bag[key];
  return typeof v === 'string' ? v : '';
};

export const numberOf = (bag: Bag, key: string): number => {
  const v = bag[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

/** The CSS blend modes the surface layers use. */
export type SurfaceBlend = 'srcOver' | 'screen' | 'multiply' | 'overlay';

export const blendOf = (css: string): SurfaceBlend =>
  css === 'screen' || css === 'multiply' || css === 'overlay' ? css : 'srcOver';

const STOP_PAIR = /(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s+(-?[\d.]+%?)\s+(-?[\d.]+%)/gi;

/**
 * CSS lets a colour stop carry two positions (`#f00 0 34%`: a flat band). The shared parser reads
 * one, so each pair becomes two stops at the same colour.
 */
export function expandStopPairs(css: string): string {
  return css.replace(STOP_PAIR, (_all, color: string, from: string, to: string) => {
    const start = /%$/.test(from) ? from : `${from}%`;
    return `${color} ${start}, ${color} ${to}`;
  });
}

/** A gradient's geometry and stop positions, whose colours live in a tweened number array. */
export type FillShape =
  | { readonly kind: 'linear'; readonly angleDeg: number; readonly positions: readonly number[] }
  | {
      readonly kind: 'radial';
      readonly value: RadialGradientValue;
      readonly positions: readonly number[];
    };

export interface Fill {
  /** Bottom layer first. */
  readonly shapes: readonly FillShape[];
  /** Every layer's stop colours, in order, 4 numbers each (straight RGBA, 0-1). */
  readonly values: readonly number[];
}

export function writeRgba(out: number[], c: Rgba) {
  out.push(c[0], c[1], c[2], c[3]);
}

/** A CSS `background` of linear and radial gradients (two-position stops allowed). */
export function parseFill(css: string): Fill {
  const shapes: FillShape[] = [];
  const values: number[] = [];
  for (const g of parseGradients(expandStopPairs(css))) {
    const stops = resolveStops(g.stops);
    shapes.push(
      g.kind === 'linear'
        ? { kind: 'linear', angleDeg: g.angleDeg, positions: stops.positions }
        : { kind: 'radial', value: g, positions: stops.positions },
    );
    stops.colors.forEach((c) => writeRgba(values, c));
  }
  return { shapes, values };
}

/** `count` colours from a flat array, starting at number `at`; alpha scaled by `k`. */
export function rgbaAt(v: readonly number[], at: number, count: number, k = 1): number[][] {
  'worklet';
  const out: number[][] = [];
  for (let i = 0; i < count; i++) {
    const o = at + 4 * i;
    out.push([v[o] ?? 0, v[o + 1] ?? 0, v[o + 2] ?? 0, (v[o + 3] ?? 0) * k]);
  }
  return out;
}

/** One colour from a flat array. */
export function rgbaOne(v: readonly number[], at: number, k = 1): number[] {
  'worklet';
  return [v[at] ?? 0, v[at + 1] ?? 0, v[at + 2] ?? 0, (v[at + 3] ?? 0) * k];
}

/**
 * A layer's structure (shapes, stop positions) as a React `key`: the numbers that tween are a flat
 * array of fixed length per structure, so a different look or variant remounts instead of tweening
 * between arrays of different lengths.
 */
export const shapeKey = (shape: unknown): string => JSON.stringify(shape);
