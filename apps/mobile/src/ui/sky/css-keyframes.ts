/**
 * The prototype's CSS keyframe animations as worklet maths, so the sky's drifts, pulses, twinkles
 * and grain run on the UI thread with the same timing as the browser.
 */

/** One coordinate of a cubic Bézier from (0,0) to (1,1) with control values a, b. */
function at(a: number, b: number, t: number): number {
  'worklet';
  return 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
}

function slope(a: number, b: number, t: number): number {
  'worklet';
  return 3 * a * (1 - t) * (1 - t) + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;
}

/** A CSS `cubic-bezier()` timing function, solved for x by Newton's method then bisection. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  return (x: number) => {
    'worklet';
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = slope(x1, x2, t);
      if (Math.abs(d) < 1e-6) break;
      t -= (at(x1, x2, t) - x) / d;
    }
    if (t < 0 || t > 1 || Math.abs(at(x1, x2, t) - x) > 1e-5) {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 40; i++) {
        t = (lo + hi) / 2;
        if (at(x1, x2, t) < x) lo = t;
        else hi = t;
      }
    }
    return at(y1, y2, t);
  };
}

/** CSS `ease-in-out`. */
const easeInOut = cubicBezier(0.42, 0, 0.58, 1);

/**
 * Progress (0–1, eased) of a CSS `ease-in-out infinite alternate` animation `durationMs` long at
 * `timeMs`; `reverse` is `alternate-reverse`.
 */
export function alternating(timeMs: number, durationMs: number, reverse = false): number {
  'worklet';
  const p = timeMs / durationMs;
  const cycle = Math.floor(p);
  const f = p - cycle;
  const backwards = (cycle % 2 === 1) !== reverse;
  return easeInOut(backwards ? 1 - f : f);
}

/** A CSS keyframe transform: translate and scale about the element's centre. */
export interface Drift {
  readonly durationMs: number;
  readonly reverse: boolean;
  readonly from: { readonly x: number; readonly y: number; readonly scale: number };
  readonly to: { readonly x: number; readonly y: number; readonly scale: number };
}

/** `@keyframes drift1`: translate(0,0) scale(1) → translate(60px,−50px) scale(1.18). */
export const drift1 = (durationMs: number, reverse = false): Drift => ({
  durationMs,
  reverse,
  from: { x: 0, y: 0, scale: 1 },
  to: { x: 60, y: -50, scale: 1.18 },
});

/** `@keyframes drift2`: translate(0,0) scale(1.1) → translate(−70px,40px) scale(.92). */
export const drift2 = (durationMs: number, reverse = false): Drift => ({
  durationMs,
  reverse,
  from: { x: 0, y: 0, scale: 1.1 },
  to: { x: -70, y: 40, scale: 0.92 },
});

/** The 3 × 3 affine of a drift at `timeMs`, about the centre (cx, cy). */
export function driftAt(drift: Drift, timeMs: number, cx: number, cy: number) {
  'worklet';
  const t = alternating(timeMs, drift.durationMs, drift.reverse);
  const { from, to } = drift;
  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;
  const s = from.scale + (to.scale - from.scale) * t;
  return [
    { translateX: cx + x },
    { translateY: cy + y },
    { scale: s },
    { translateX: -cx },
    { translateY: -cy },
  ];
}

const GRAIN_STEP_MS = 800;
/** `@keyframes grain` under `steps(1)`: the tile jumps between three offsets every 0.8 s. */
const GRAIN_OFFSETS = [
  [0, 0],
  [-47, 31],
  [63, -22],
] as const;

/** Which of the three grain offsets shows at `timeMs`. */
export function grainStep(timeMs: number): 0 | 1 | 2 {
  'worklet';
  const p = (timeMs % GRAIN_STEP_MS) / GRAIN_STEP_MS;
  return p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
}

export function grainOffset(timeMs: number): readonly [number, number] {
  'worklet';
  return GRAIN_OFFSETS[grainStep(timeMs)];
}
