/** The sheen's CSS keyframes as worklet maths (`time` is milliseconds). */

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
