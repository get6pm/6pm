/**
 * The design's repeatable random numbers (a linear congruential generator), so the stars, tiles
 * and flying chips land exactly where the prototype puts them.
 */
export function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Smoothstep on 0..1. */
export const ease = (x: number): number => x * x * (3 - 2 * x);
