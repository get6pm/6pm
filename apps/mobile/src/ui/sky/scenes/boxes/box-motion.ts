import { Easing } from 'react-native-reanimated';

import type { BoxAnimation } from './box-model';

/** CSS `ease-in-out`. */
const easeInOut = Easing.bezierFn(0.42, 0, 0.58, 1);

/** `flick`: lit, with three short drop-outs to .18 (keyframes held, `steps(1)`). */
const FLICK: readonly (readonly [number, number])[] = [
  [0.19, 1],
  [0.205, 0.18],
  [0.22, 1],
  [0.23, 0.18],
  [0.62, 1],
  [0.635, 0.18],
  [1, 1],
];

/** Progress through an `infinite` animation, 0–1, and which cycle it is in. */
function cycle(timeMs: number, periodMs: number, delayMs: number): [number, number] {
  'worklet';
  const p = (timeMs - delayMs) / periodMs;
  const n = Math.floor(p);
  return [p - n, n];
}

/** The opacity an animation sets at a moment, or null when it leaves opacity alone. */
export function animatedOpacity(a: BoxAnimation | null, timeMs: number): number | null {
  'worklet';
  if (!a) return null;
  if (a.kind === 'breathe') {
    const [f, n] = cycle(timeMs, a.periodMs, a.delayMs);
    // `alternate`: every other cycle runs backwards, timing function included.
    const directed = n % 2 === 0 ? f : 1 - f;
    const t = a.steps > 0 ? Math.floor(directed * a.steps) / a.steps : easeInOut(directed);
    return 0.45 + 0.55 * t;
  }
  if (a.kind === 'flick') {
    const [f] = cycle(timeMs, a.periodMs, 0);
    for (const [until, value] of FLICK) if (f < until) return value;
    return 1;
  }
  return null;
}

/** The rotation (degrees) and lift (points) an animation sets at a moment. */
export function animatedTransform(
  a: BoxAnimation | null,
  timeMs: number,
): { readonly rotateDeg: number; readonly dy: number } | null {
  'worklet';
  if (!a) return null;
  if (a.kind === 'spin') {
    const [f] = cycle(timeMs, a.periodMs, a.delayMs);
    return { rotateDeg: f * 360, dy: 0 };
  }
  if (a.kind === 'floaty') {
    const [f] = cycle(timeMs, a.periodMs, a.delayMs);
    // 0% and 100% at rest, 50% lifted 8 pt, eased into and out of each half.
    const half = f < 0.5 ? f / 0.5 : (1 - f) / 0.5;
    return { rotateDeg: 0, dy: -8 * easeInOut(half) };
  }
  return null;
}
