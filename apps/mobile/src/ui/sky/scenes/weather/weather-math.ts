/**
 * The weather keyframes as worklet maths, so rain, drops and lightning run on the UI thread with
 * the prototype's timing. Every function is a pure function of the sky clock (held at 0 under
 * Reduce Motion, which parks each layer at its first frame).
 */

/** Wraps a CSS `linear infinite` animation to its 0–1 progress (negative delay starts it part-way). */
export function loop(timeMs: number, periodMs: number, delayMs = 0): number {
  'worklet';
  const elapsed = Math.max(0, timeMs - delayMs);
  const p = (elapsed / periodMs) % 1;
  return p < 0 ? p + 1 : p;
}

/** `@keyframes rainfall`: the tile slides down by one tile height each period, linearly. */
export function rainOffset(timeMs: number, periodMs: number, tileHeight: number): number {
  'worklet';
  return loop(timeMs, periodMs) * tileHeight;
}

/** `@keyframes fogDrift`: translateX(−12%) → translateX(12%) of the element's own width. */
export function fogShift(progress: number, elementWidth: number): number {
  'worklet';
  return (-0.12 + 0.24 * progress) * elementWidth;
}

const FLASH = [
  [0, 0],
  [0.88, 0],
  [0.89, 0.6],
  [0.9, 0.08],
  [0.915, 0.45],
  [0.935, 0],
  [1, 0],
] as const;

export const FLASH_PERIOD_MS = 11_000;
export const FLASH_DELAY_MS = 2_000;

/** `@keyframes flash` under `11s linear 2s infinite`: two quick strobes near the end of each cycle. */
export function flashOpacity(timeMs: number): number {
  'worklet';
  if (timeMs < FLASH_DELAY_MS) return 0;
  const p = loop(timeMs, FLASH_PERIOD_MS, FLASH_DELAY_MS);
  for (let i = 1; i < FLASH.length; i++) {
    const [p1, o1] = FLASH[i] ?? [1, 0];
    if (p <= p1) {
      const [p0, o0] = FLASH[i - 1] ?? [0, 0];
      return o0 + ((o1 - o0) * (p - p0)) / (p1 - p0);
    }
  }
  return 0;
}

export const DROP_TRAVEL = 260;

/**
 * `@keyframes dropSlide` under `linear infinite`: fades in over the first 8%, slides 260 pt down,
 * fades out over the last 15%.
 */
export function dropFrame(
  timeMs: number,
  periodMs: number,
  delayMs: number,
): { readonly y: number; readonly opacity: number } {
  'worklet';
  const p = loop(timeMs, periodMs, delayMs);
  const opacity = p < 0.08 ? p / 0.08 : p <= 0.85 ? 1 : (1 - p) / 0.15;
  return { y: DROP_TRAVEL * p, opacity };
}
