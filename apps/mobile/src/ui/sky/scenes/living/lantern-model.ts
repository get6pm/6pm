import {
  parseBoxShadows,
  parseGradients,
  parseColor,
  resolveStops,
  type RadialGradientValue,
  type Rgba,
} from '../../css-values';
import {
  flag,
  flat,
  lengthOf,
  millisOf,
  numberOf,
  rgbaOf,
  rowsOf,
  textOf,
  type Atm,
  type Row,
} from './living-parse';

/** One straight piece of a string of lights. */
export interface Wire {
  readonly x: number;
  readonly y: number;
  readonly length: number;
  /** Radians, clockwise. */
  readonly angle: number;
}

export interface Bulb {
  readonly x: number;
  readonly y: number;
  readonly periodMs: number;
}

export interface Sway {
  readonly durationMs: number;
  readonly delayMs: number;
}

export interface Lantern {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly cord: number;
  readonly tassel: number;
  readonly tasselColor: Rgba;
  readonly opacity: number;
  /** Where the silk's three colours sit along the gradient's ray. */
  readonly stops: readonly number[];
  /** The paper ribs: width of the clear gap, period, and ink; none when the silk is plain. */
  readonly rib: { readonly gap: number; readonly period: number; readonly ink: Rgba } | null;
  readonly sway: Sway | null;
}

export interface LanternModel {
  readonly wires: readonly Wire[];
  readonly bulbs: readonly Bulb[];
  readonly lanterns: readonly Lantern[];
}

/** Hour-driven numbers of the strings and lanterns. */
export const BULB_VALUES = 6;
export const LANTERN_VALUES = 18;

function parseSway(css: string): Sway | null {
  const m = /^sway ([\d.]+)s ease-in-out (-?[\d.]+)s infinite alternate$/.exec(css.trim());
  return m?.[1] && m[2] ? { durationMs: Number(m[1]) * 1000, delayMs: Number(m[2]) * 1000 } : null;
}

function radialOf(css: string): RadialGradientValue | null {
  return parseGradients(css).find((g): g is RadialGradientValue => g.kind === 'radial') ?? null;
}

function lanternOf(row: Row): Lantern | null {
  const bg = textOf(row, 'bg');
  const silk = radialOf(bg);
  const stops = silk ? resolveStops(silk.stops) : null;
  if (!stops || stops.colors.length !== 3) return null;
  const ribs =
    /repeating-linear-gradient\(90deg, rgba\(0,0,0,0\) 0 ([\d.]+)px, (rgba\([^)]*\)) [\d.]+px ([\d.]+)px\)/.exec(
      bg,
    );
  return {
    x: lengthOf(row.l, 0),
    y: lengthOf(row.t, 0),
    w: lengthOf(row.w, 0),
    h: lengthOf(row.h, 0),
    cord: lengthOf(row.cord, 0),
    tassel: lengthOf(row.tas, 0),
    tasselColor: parseColor(textOf(row, 'tc')) ?? [0, 0, 0, 1],
    opacity: numberOf(row, 'op') || 1,
    stops: stops.positions,
    rib:
      ribs?.[1] && ribs[2] && ribs[3]
        ? {
            gap: Number(ribs[1]),
            period: Number(ribs[3]),
            ink: rgbaOf(ribs[2]) as unknown as Rgba,
          }
        : null,
    sway: parseSway(textOf(row, 'anim')),
  };
}

/**
 * Lantern River's strings of lights and silk lanterns, as the prototype's atmosphere lays them
 * out: two catenary wires of 25 bulbs each, five lanterns hanging from each. `null` when the
 * atmosphere is not Lantern River's.
 */
export function lanternModel(atm: Atm): LanternModel | null {
  if (!flag(atm, 'lanternOn')) return null;
  const wires = rowsOf(atm, 'wires').map((w): Wire => ({
    x: lengthOf(w.l, 0),
    // The 1 pt line turns about its left end's middle, half a point below its `top`.
    y: lengthOf(w.t, 0) + 0.5,
    length: lengthOf(w.w, 0),
    angle: (parseFloat(textOf(w, 'rot')) * Math.PI) / 180,
  }));
  const bulbs = rowsOf(atm, 'bulbs').map((b): Bulb => ({
    x: lengthOf(b.l, 0),
    y: lengthOf(b.t, 0),
    periodMs: millisOf(b.d),
  }));
  const lanterns = rowsOf(atm, 'lanterns').flatMap((row) => {
    const l = lanternOf(row);
    return l ? [l] : [];
  });
  return { wires, bulbs, lanterns };
}

/** The wire colour at this hour (RGBA). */
export function wireColor(atm: Atm): readonly number[] {
  return rgbaOf(textOf(atm, 'wire'));
}

/**
 * The bulbs' hour-driven numbers, flat: the shared glow (σ, spread, colour) then each bulb's
 * colour. The glow is `0 0 <blur>px <spread>px <colour>`, the same on every bulb.
 */
export function bulbValues(atm: Atm): number[] {
  const rows = rowsOf(atm, 'bulbs');
  const glow = parseBoxShadows(textOf(rows[0] ?? {}, 'glow'))[0];
  return [
    (glow?.blur ?? 0) / 2,
    glow?.spread ?? 0,
    ...(glow?.color ?? [0, 0, 0, 0]),
    ...flat(rows.map((b) => rgbaOf(textOf(b, 'c')))),
  ];
}

/**
 * Each lantern's hour-driven numbers, flat: silk centre, body and edge colours, then its glow's
 * colour, σ and spread (`0 0 <blur>px <spread>px <colour>`).
 */
export function lanternValues(atm: Atm): number[] {
  return rowsOf(atm, 'lanterns').flatMap((row) => {
    const silk = radialOf(textOf(row, 'bg'));
    const stops = silk ? resolveStops(silk.stops) : null;
    if (!stops || stops.colors.length !== 3) return [];
    const glow = parseBoxShadows(textOf(row, 'glow'))[0];
    return [
      ...flat(stops.colors),
      ...(glow?.color ?? [0, 0, 0, 0]),
      (glow?.blur ?? 0) / 2,
      glow?.spread ?? 0,
    ];
  });
}
