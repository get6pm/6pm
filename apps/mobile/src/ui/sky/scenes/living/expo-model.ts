import { parseGradients, type LinearGradientValue, type Rgba } from '../../css-values';
import {
  flag,
  flat,
  lengthOf,
  millisOf,
  numberOf,
  rawStops,
  rgbaOf,
  rowsOf,
  textOf,
  type Atm,
} from './living-parse';

/** The sky turns once every 160 s (`spin 160s linear infinite`). */
export const SPIN_MS = 160_000;
/** The star-trail discs are 1700 pt wide, so nothing shows beyond 850 pt of the pole. */
export const TRAIL_RADIUS = 850;
export const TRAFFIC_HEIGHT = 120;
/** A car crosses 1020 pt over its period: `translateX(-300px)` to `translateX(720px)`. */
export const CAR_FROM = -300;
export const CAR_TRAVEL = 1020;

/** One star trail: a ring every `period` pt, lit over the arc the conic mask leaves open. */
export interface TrailSpec {
  readonly period: number;
  readonly ink: Rgba;
  readonly fromDeg: number;
  readonly spanDeg: number;
}

export interface CarSpec {
  /** Top of the car in the traffic box, and its size. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** 1 for `carR` (heading right, head light), −1 for `carL` (tail light). */
  readonly direction: 1 | -1;
  readonly durationMs: number;
  readonly delayMs: number;
}

export interface LaneLine {
  readonly from: number;
  readonly to: number;
}

export interface ExpoModel {
  /** The two switches: star trails and traffic trails. */
  readonly stars: boolean;
  readonly traffic: boolean;
  readonly starsOpacity: number;
  readonly trafficOpacity: number;
  /** Pole star: x as a fraction of the width, y in points. */
  readonly pole: { readonly x: number; readonly y: number };
  readonly trails: readonly TrailSpec[];
  readonly cars: readonly CarSpec[];
  readonly lanes: readonly LaneLine[];
  /** Hour-driven colours, flat RGBA: head and tip of each direction, then one per lane line. */
  readonly colors: readonly number[];
}

function parseTrail(bg: string, mask: string): TrailSpec | null {
  const ring =
    /repeating-radial-gradient\(circle, transparent 0 [\d.]+px, (rgba?\([^)]*\)) ([\d.]+)px ([\d.]+)px\)/.exec(
      bg,
    );
  const from = /conic-gradient\(from (-?[\d.]+)deg/.exec(mask);
  const peaks = [...mask.matchAll(/#000 ([\d.]+)deg/g)].map((m) => Number(m[1]));
  if (!ring?.[1] || !ring[3] || !from?.[1] || peaks.length !== 2) return null;
  const span = peaks[0] ?? 0;
  // The second arc starts at 180° and is 0.7× as long: the two arcs the shader draws.
  if (Math.abs((peaks[1] ?? 0) - (180 + span * 0.7)) > 1e-6) return null;
  return {
    period: Number(ring[3]),
    ink: [...rgbaOf(ring[1])] as unknown as Rgba,
    fromDeg: Number(from[1]),
    spanDeg: span,
  };
}

function linear(css: string): LinearGradientValue | null {
  return parseGradients(css).find((g): g is LinearGradientValue => g.kind === 'linear') ?? null;
}

/** The visible bands of the lanes gradient: each opaque stop that follows a clear one. */
function laneLines(css: string): { lines: LaneLine[]; colors: Rgba[] } {
  const stops = rawStops(css);
  const lines: LaneLine[] = [];
  const colors: Rgba[] = [];
  stops.forEach((stop, i) => {
    const previous = stops[i - 1];
    if (stop.color[3] === 0 || (previous && previous.color[3] > 0)) return;
    const [from, to] = stop.at;
    if (from === undefined || to === undefined) return;
    lines.push({ from, to });
    colors.push(stop.color);
  });
  return { lines, colors };
}

/** The head and tip colours of a car's gradient (`c00 → c at 78% → tip`). */
function carColors(css: string): { head: Rgba; tip: Rgba } | null {
  const stops = linear(css)?.stops;
  const head = stops?.[1]?.color;
  const tip = stops?.[2]?.color;
  return head && tip ? { head, tip } : null;
}

/**
 * Long Exposure's layers as the prototype's atmosphere describes them: star trails (their rings
 * and arcs), twelve cars on four lanes and the lane glints. `null` when the atmosphere is not
 * Long Exposure's or does not read as expected.
 */
export function expoModel(atm: Atm): ExpoModel | null {
  if (!('trails' in atm) || !('cars' in atm)) return null;
  const trails = rowsOf(atm, 'trails').flatMap((t) => {
    const spec = parseTrail(textOf(t, 'bg'), textOf(t, 'mask'));
    return spec ? [spec] : [];
  });
  const lanes = laneLines(textOf(atm, 'lanes'));

  const cars: CarSpec[] = [];
  const heads: Partial<Record<1 | -1, { head: Rgba; tip: Rgba }>> = {};
  for (const row of rowsOf(atm, 'cars')) {
    const direction = textOf(row, 'anim') === 'carR' ? 1 : -1;
    const colors = carColors(textOf(row, 'bg'));
    if (!colors) continue;
    heads[direction] ??= colors;
    cars.push({
      y: lengthOf(row.y, 0),
      width: lengthOf(row.w, 0),
      height: lengthOf(row.h, 0),
      direction,
      durationMs: millisOf(row.d),
      delayMs: millisOf(row.delay),
    });
  }
  const right = heads[1];
  const left = heads[-1];
  if (trails.length !== 3 || !right || !left || lanes.lines.length !== 4) return null;

  return {
    stars: flag(atm, 'starsOn'),
    traffic: flag(atm, 'trafficOn'),
    starsOpacity: numberOf(atm, 'starsOp'),
    trafficOpacity: numberOf(atm, 'trafficOp'),
    pole: { x: lengthOf(atm.poleX, 1), y: lengthOf(atm.poleY, 0) },
    trails,
    cars,
    lanes: lanes.lines,
    colors: flat([right.head, right.tip, left.head, left.tip, ...lanes.colors]),
  };
}

/** Offsets into `ExpoModel.colors`. */
export const EXPO_COLOR = {
  rightHead: 0,
  rightTip: 4,
  leftHead: 8,
  leftTip: 12,
  lane: 16,
} as const;

/** How far along its crossing a car is at `timeMs` (0–1), as `carR`/`carL` run linear and endless. */
export function carProgress(car: Pick<CarSpec, 'durationMs' | 'delayMs'>, timeMs: number): number {
  'worklet';
  const p = (timeMs - car.delayMs) / car.durationMs;
  return p - Math.floor(p);
}

/** A car's x offset from the traffic box's left edge. */
export function carOffset(direction: 1 | -1, progress: number): number {
  'worklet';
  return direction === 1
    ? CAR_FROM + CAR_TRAVEL * progress
    : CAR_FROM + CAR_TRAVEL * (1 - progress);
}
