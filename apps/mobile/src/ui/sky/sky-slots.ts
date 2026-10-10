/**
 * Everything on the sky that changes with the hour is packed into one flat array of numbers, so a
 * new hour animates as a single UI-thread tween of that array (the prototype's `transition: 1s`)
 * instead of jumping. Colours take four slots (straight RGBA, 0–1), every other value one.
 */

import type { Rgba } from './css-values';

export const SUN_STOPS = 3;
export const SUN_RINGS = 3;
export const STREAK_STOPS = 7;
export const MAX_BOKEH = 10;
export const MAX_LEAKS = 2;
export const LEAK_STOPS = 2;

function layout() {
  let size = 0;
  const one = () => size++;
  const colors = (count = 1) => {
    const at = size;
    size += 4 * count;
    return at;
  };
  const many = (count: number) => {
    const at = size;
    size += count;
    return at;
  };
  const slots = {
    sky: colors(3),
    bloomA: colors(),
    bloomB: colors(),
    bloomOp: one(),
    sunX: one(),
    sunY: one(),
    sunSize: one(),
    sunOp: one(),
    sunFocusY: one(),
    sunStops: colors(SUN_STOPS),
    sunStopAt: many(SUN_STOPS),
    rings: colors(SUN_RINGS),
    ringSpread: many(SUN_RINGS),
    halo: colors(),
    haloSigma: one(),
    haloSpread: one(),
    streak: colors(STREAK_STOPS),
    streakOp: one(),
    streakSoft: one(),
    moonOp: one(),
    bokeh: colors(MAX_BOKEH),
    bokehOp: one(),
    dot: colors(),
    dotOp: one(),
    leak: colors(MAX_LEAKS * LEAK_STOPS),
    leakOp: one(),
    vignette: colors(),
    grainOp: one(),
  };
  return { ...slots, length: size };
}

export const SLOT = layout();

/** The colour at a slot, its alpha scaled by `k`. */
export function colorAt(v: readonly number[], at: number, k = 1): number[] {
  'worklet';
  return [v[at] ?? 0, v[at + 1] ?? 0, v[at + 2] ?? 0, (v[at + 3] ?? 0) * k];
}

/** `count` consecutive colours from a slot. */
export function colorsAt(v: readonly number[], at: number, count: number): number[][] {
  'worklet';
  const out: number[][] = [];
  for (let i = 0; i < count; i++) out.push(colorAt(v, at + 4 * i));
  return out;
}

export function writeColor(v: number[], at: number, c: Rgba) {
  v[at] = c[0];
  v[at + 1] = c[1];
  v[at + 2] = c[2];
  v[at + 3] = c[3];
}
