/**
 * The clock a drawn step plays on. `t` runs from 0 to 1 over the step's loop and wraps: the screen
 * acts between 0 and `SETTLED`, holds its end state, fades to white, swaps back to its start state
 * at `RESTART` and fades in again, so the wrap from 1 to 0 never shows.
 */
export const SETTLED = 0.86;
const FADE_OUT = 0.9;
export const RESTART = 0.94;

/** The step's clock as the drawing reads it: back at the start once the screen has faded out. */
export function local(t: number): number {
  'worklet';
  return t >= RESTART ? 0 : t;
}

function clamp01(x: number): number {
  'worklet';
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** The entrance curve's feel without a bezier solve: a quick start that settles softly. */
function easeOutCubic(x: number): number {
  'worklet';
  const k = 1 - x;
  return 1 - k * k * k;
}

/** Ease in and out, for a finger travelling between two points. */
function easeInOut(x: number): number {
  'worklet';
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** How far along a change running from `from` to `to` is, eased: 0 before, 1 after. */
export function stage(t: number, from: number, to: number): number {
  'worklet';
  const x = local(t);
  if (to <= from) return x >= from ? 1 : 0;
  return easeOutCubic(clamp01((x - from) / (to - from)));
}

/** The screen's opacity: whole while it plays, through white and back while it restarts. */
export function screenOpacity(t: number): number {
  'worklet';
  if (t < FADE_OUT) return 1;
  if (t < RESTART) return 1 - (t - FADE_OUT) / (RESTART - FADE_OUT);
  return clamp01((t - RESTART) / (1 - RESTART));
}

/** One stop on the finger's path, in the drawn screen's points. */
export interface TouchStop {
  readonly at: number;
  readonly x: number;
  readonly y: number;
  /** The finger presses here. */
  readonly tap?: boolean;
}

/** Where the finger is at `t`: resting at each stop, gliding between them. */
export function touchPoint(
  t: number,
  stops: readonly TouchStop[],
): { readonly x: number; readonly y: number } {
  'worklet';
  const x = local(t);
  const first = stops[0];
  if (!first) return { x: 0, y: 0 };
  if (x <= first.at) return { x: first.x, y: first.y };
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (!a || !b) break;
    if (x < b.at) {
      // Glide in the first 70 % of the gap, then rest so the tap reads.
      const span = (b.at - a.at) * 0.7;
      const p = easeInOut(clamp01((x - a.at) / span));
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
    }
  }
  const last = stops[stops.length - 1] ?? first;
  return { x: last.x, y: last.y };
}

/** How far the finger is pressed at `t`: a short dip at each tap stop. */
export function touchPress(t: number, stops: readonly TouchStop[]): number {
  'worklet';
  const x = local(t);
  let press = 0;
  for (const stop of stops) {
    if (!stop.tap) continue;
    const d = x - stop.at;
    if (d >= -0.03 && d <= 0.05) press = Math.max(press, d < 0 ? 1 + d / 0.03 : 1 - d / 0.05);
  }
  return clamp01(press);
}

/** The finger's opacity: in just before its first stop, out as the step settles. */
export function touchOpacity(t: number, stops: readonly TouchStop[]): number {
  'worklet';
  const first = stops[0];
  if (!first) return 0;
  const x = local(t);
  const appear = clamp01((x - (first.at - 0.06)) / 0.06);
  const leave = 1 - clamp01((x - SETTLED + 0.04) / 0.04);
  return Math.min(appear, leave);
}
