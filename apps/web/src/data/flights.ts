import { seeded } from './seeded';

/** How many spends fly past in the leak. */
export const chipCount = 84;

/** Where each chip flies from: angle, radius, start delay and spin. */
export function chipFlights(): readonly { a: number; r: number; d: number; ro: number }[] {
  const r = seeded(11);
  return Array.from({ length: chipCount }, () => ({
    a: r() * Math.PI * 2,
    r: 240 + r() * 460,
    d: r(),
    ro: (r() - 0.5) * 26,
  }));
}
