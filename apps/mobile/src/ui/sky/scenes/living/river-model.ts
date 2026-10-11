import {
  parseBoxShadows,
  parseGradients,
  resolveStops,
  type GradientValue,
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
} from './living-parse';

/** The river is 160 pt tall, 388 pt down. */
export const RIVER_TOP = 388;
export const RIVER_HEIGHT = 160;

/** `@keyframes floatX`: a lantern drifts from −40 pt to 450 pt, linear. */
export const FLOAT_FROM = -40;
export const FLOAT_TRAVEL = 490;
/** A floating lantern is 10 × 6 pt, its top corners squarer than its bottom ones. */
export const FLOAT_W = 10;
export const FLOAT_H = 6;

/** One layer of the river's colour: a reflection streak or the wash beneath. */
export interface RiverLayer {
  readonly gradient: GradientValue;
  readonly positions: readonly number[];
}

export interface RiverModel {
  /** Drawn bottom first. */
  readonly layers: readonly RiverLayer[];
}

export interface Floater {
  readonly y: number;
  readonly durationMs: number;
  readonly delayMs: number;
  /** The tighter glow's blur σ and spread are hour-driven; the lower reflection is fixed. */
  readonly reflection: { readonly dy: number; readonly sigma: number; readonly spread: number };
}

/** Per floater: body colour, glow colour, glow σ, glow spread, reflection colour. */
export const FLOAT_VALUES = 14;

/**
 * The river: five reflection streaks over a wash, striped into 2 pt lines every 5 pt and faded
 * at top and bottom. `null` when the river is off or does not read as expected.
 */
export function riverModel(atm: Atm): RiverModel | null {
  if (!flag(atm, 'riverOn')) return null;
  const layers: RiverLayer[] = [];
  for (const gradient of parseGradients(textOf(atm, 'river'))) {
    const stops = resolveStops(gradient.stops);
    if (stops.colors.length !== 2) return null;
    layers.push({ gradient, positions: stops.positions });
  }
  return layers.length > 0 ? { layers } : null;
}

/**
 * The river's hour-driven numbers, flat: its opacity, then the two stop colours of every layer.
 * Same length whether or not the river is shown, so a toggle never changes it.
 */
export function riverValues(atm: Atm): number[] {
  const colors: Rgba[] = [];
  for (const gradient of parseGradients(textOf(atm, 'river'))) {
    const stops = resolveStops(gradient.stops);
    if (stops.colors.length !== 2) return [numberOf(atm, 'riverOp')];
    colors.push(...stops.colors);
  }
  return [numberOf(atm, 'riverOp'), ...flat(colors)];
}

export function floaters(atm: Atm): Floater[] {
  if (!flag(atm, 'riverOn')) return [];
  return rowsOf(atm, 'floats').map((row) => {
    const [, reflection] = parseBoxShadows(textOf(row, 'glow'));
    return {
      y: lengthOf(row.t, 0),
      durationMs: millisOf(row.d),
      delayMs: millisOf(row.delay),
      reflection: {
        dy: reflection?.y ?? 0,
        sigma: (reflection?.blur ?? 0) / 2,
        spread: reflection?.spread ?? 0,
      },
    };
  });
}

/** Each floater's hour-driven numbers (see `FLOAT_VALUES`), flat. */
export function floatValues(atm: Atm): number[] {
  return rowsOf(atm, 'floats').flatMap((row) => {
    const [near, reflection] = parseBoxShadows(textOf(row, 'glow'));
    return [
      ...rgbaOf(textOf(row, 'c')),
      ...(near?.color ?? [0, 0, 0, 0]),
      (near?.blur ?? 0) / 2,
      near?.spread ?? 0,
      ...(reflection?.color ?? [0, 0, 0, 0]),
    ];
  });
}

/** How far across its path a floater is at `timeMs` (0–1): linear and endless. */
export function floatProgress(f: Pick<Floater, 'durationMs' | 'delayMs'>, timeMs: number): number {
  'worklet';
  const p = (timeMs - f.delayMs) / f.durationMs;
  return p - Math.floor(p);
}
