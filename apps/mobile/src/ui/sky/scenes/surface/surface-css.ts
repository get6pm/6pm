/**
 * Reads the CSS the look engine produces for a sheen into shapes that stay put and numbers that
 * tween with the hour, so every colour on screen is the one the prototype computes. Two-position
 * stops (`color 0 34%`), which the shared parser leaves out, are expanded here first.
 */

import {
  parseGradients,
  resolveStops,
  type RadialGradientValue,
  type Rgba,
} from '../../css-values';

type Bag = Readonly<Record<string, unknown>>;

export const textOf = (bag: Bag, key: string): string => {
  const v = bag[key];
  return typeof v === 'string' ? v : '';
};

export const numberOf = (bag: Bag, key: string): number => {
  const v = bag[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

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
