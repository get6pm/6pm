/** The surface looks' CSS keyframe animations as worklet maths (`time` is milliseconds). */

import { alternating } from '../../css-keyframes';

/** CSS `ease-in-out` of a 0-1 progress (the first forward cycle of an `alternate` animation). */
function easeInOut(progress: number): number {
  'worklet';
  return alternating(Math.min(1, Math.max(0, progress)), 1);
}

const SHEEN_MS = 9_000;
/** `@keyframes sheen`: moves from -35% to +35% of its width by 55% of the cycle, then waits. */
const SHEEN_TRAVEL = 0.55;

/**
 * The horizontal shift of the sheen band at `timeMs`, in points, for a band `boxWidth` wide
 * (`sheen 9s ease-in-out infinite`: -35% → 35% over the first 55%, still for the rest, then back).
 */
export function sheenShift(timeMs: number, boxWidth: number): number {
  'worklet';
  const u = (timeMs % SHEEN_MS) / SHEEN_MS;
  const e = u >= SHEEN_TRAVEL ? 1 : easeInOut(u / SHEEN_TRAVEL);
  return (-0.35 + 0.7 * e) * boxWidth;
}

const ROLL_MS = 7_000;
/** The height of the CRT's rolling bar. */
export const CRT_BAR = 120;

/** `@keyframes crtRoll` (`linear infinite`, 7 s): the bar's top edge runs from -120 pt to 100%. */
export function crtBarTop(timeMs: number, screenHeight: number): number {
  'worklet';
  const u = (timeMs % ROLL_MS) / ROLL_MS;
  return -CRT_BAR + (screenHeight + CRT_BAR) * u;
}

/** `@keyframes spin` (`linear infinite`): the clockwise angle in radians at `timeMs`. */
export function spinAngle(timeMs: number, periodMs: number): number {
  'worklet';
  return (2 * Math.PI * (timeMs % periodMs)) / periodMs;
}

/**
 * `@keyframes twinkle` with a CSS delay, `ease-in-out infinite alternate`: 0 → 1 → 0. A negative
 * delay starts the glint part-way through its cycle; a positive one holds it at 0.
 */
export function twinkle(timeMs: number, delayMs: number, periodMs: number): number {
  'worklet';
  return alternating(Math.max(0, timeMs - delayMs), periodMs);
}

/** `"22s"` → 22000. */
export function secondsToMs(css: string, fallbackMs: number): number {
  const m = /^(-?[\d.]+)s$/.exec(css.trim());
  return m?.[1] ? Number(m[1]) * 1000 : fallbackMs;
}
