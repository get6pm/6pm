/**
 * The iOS-style wheel's maths, as the prototype's Wheel computes it. Positions are fractional row
 * indexes (2.5 sits halfway between rows 2 and 3); every function runs on the UI thread.
 */

/** A row is 1.4× the type size. */
const ROW_RATIO = 1.4;
/** Past either end the column follows the finger at 0.3×. */
const RUBBER_BAND = 0.3;
/** A fling travels as far as its release velocity would carry it in 220 ms. */
const MOMENTUM_MS = 220;
/** Rows fade, shrink and tilt with distance from the centre, up to three rows away. */
const MAX_DISTANCE = 3;
const FADE_PER_ROW = 0.36;
const SHRINK_PER_ROW = 0.07;
const TILT_PER_ROW_DEG = 22;
const MIN_OPACITY = 0.1;
/** The top and bottom fade: clear at the edges, solid from 34% to 66% of the height. */
const MASK_SOLID_FROM = 0.34;

export function wheelRowHeight(size: number): number {
  'worklet';
  return Math.round(size * ROW_RATIO);
}

export function clampPosition(position: number, count: number): number {
  'worklet';
  return Math.max(0, Math.min(count - 1, position));
}

/** Where the column sits while dragged: free between the ends, held back past them. */
export function rubberBand(raw: number, count: number): number {
  'worklet';
  const last = count - 1;
  if (raw < 0) return raw * RUBBER_BAND;
  if (raw > last) return last + (raw - last) * RUBBER_BAND;
  return raw;
}

/**
 * The row a released drag settles on. `velocity` is the finger's speed in points per millisecond,
 * positive downward; a downward fling moves toward the first row.
 */
export function momentumIndex(
  position: number,
  velocity: number,
  rowHeight: number,
  count: number,
): number {
  'worklet';
  return Math.round(clampPosition(position - (velocity * MOMENTUM_MS) / rowHeight, count));
}

/** The row under a tap at `y` points from the wheel's top. */
export function rowAt(
  y: number,
  position: number,
  rowHeight: number,
  rows: number,
  count: number,
): number {
  'worklet';
  const pad = ((rows - 1) / 2) * rowHeight;
  return Math.round(clampPosition(position + (y - pad - rowHeight / 2) / rowHeight, count));
}

/** The column's offset: the row at `position` sits in the middle. */
export function columnOffset(position: number, rowHeight: number, rows: number): number {
  'worklet';
  return ((rows - 1) / 2) * rowHeight - position * rowHeight;
}

export interface RowLook {
  readonly opacity: number;
  readonly scale: number;
  /** Degrees about the horizontal axis; rows above the centre lean back, rows below lean forward. */
  readonly rotateX: number;
}

/** How a row looks `distance` rows from the centre (negative: above it). */
export function rowLook(distance: number): RowLook {
  'worklet';
  const away = Math.min(Math.abs(distance), MAX_DISTANCE);
  const lean = Math.max(-MAX_DISTANCE, Math.min(MAX_DISTANCE, distance));
  return {
    opacity: Math.max(MIN_OPACITY, 1 - away * FADE_PER_ROW),
    scale: 1 - away * SHRINK_PER_ROW,
    rotateX: lean === 0 ? 0 : -lean * TILT_PER_ROW_DEG,
  };
}

/** The top and bottom fade at `fraction` of the wheel's height (0 top, 1 bottom). */
export function edgeFade(fraction: number): number {
  'worklet';
  const fromEdge = Math.min(fraction, 1 - fraction);
  return Math.max(0, Math.min(1, fromEdge / MASK_SOLID_FROM));
}
