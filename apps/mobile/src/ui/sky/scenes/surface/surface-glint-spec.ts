/**
 * Gold-leaf flakes (Sơn Mài) and sparkles (Holo Foil), read from the atmosphere's `glints` list.
 * Positions, sizes, fills and timings stay put; the glow colours (Holo's follow the hour) are one
 * flat array that tweens.
 */

import { parseBoxShadows, parseColor, parseGradients, resolveStops } from '../../css-values';
import { secondsToMs } from './surface-motion';
import { writeRgba } from './surface-css';

export interface GlintFill {
  readonly angleDeg: number;
  readonly positions: readonly number[];
  /** Straight RGBA per stop; a single stop is a flat colour. */
  readonly colors: readonly (readonly number[])[];
}

export interface GlintShape {
  /** Left edge as a fraction of the screen width. */
  readonly left: number;
  /** Top edge in points. */
  readonly top: number;
  readonly w: number;
  readonly h: number;
  /** Clockwise, in radians, about the flake's centre. */
  readonly rotation: number;
  readonly radius: number;
  readonly periodMs: number;
  readonly delayMs: number;
  readonly fill: GlintFill;
  /** Outer glows, topmost first. */
  readonly shadows: readonly { readonly blur: number; readonly spread: number }[];
  /** Where this flake's glow colours start in `Glints.glow`. */
  readonly glowAt: number;
}

export interface Glints {
  readonly shapes: readonly GlintShape[];
  /** Every flake's glow colours, 4 numbers each. */
  readonly glow: readonly number[];
}

const px = (v: unknown): number => parseFloat(String(v)) || 0;

function fillOf(css: string): GlintFill | null {
  const flat = parseColor(css);
  if (flat) return { angleDeg: 180, positions: [0], colors: [[...flat]] };
  const g = parseGradients(css)[0];
  if (g?.kind !== 'linear') return null;
  const stops = resolveStops(g.stops);
  return {
    angleDeg: g.angleDeg,
    positions: stops.positions,
    colors: stops.colors.map((c) => [...c]),
  };
}

/** Flakes the engine describes; entries it writes in a form we do not read are skipped. */
export function parseGlints(raw: unknown): Glints {
  const shapes: GlintShape[] = [];
  const glow: number[] = [];
  if (!Array.isArray(raw)) return { shapes, glow };
  for (const item of raw as Record<string, unknown>[]) {
    const fill = fillOf(String(item.bg));
    if (!fill) continue;
    const shadows = parseBoxShadows(String(item.glow)).filter((s) => !s.inset);
    const glowAt = glow.length;
    shadows.forEach((s) => writeRgba(glow, s.color));
    shapes.push({
      left: px(item.l) / 100,
      top: px(item.t),
      w: px(item.w),
      h: px(item.h),
      rotation: (px(item.rot) * Math.PI) / 180,
      radius: px(item.radius),
      periodMs: secondsToMs(String(item.d), 3000),
      delayMs: secondsToMs(String(item.delay), 0),
      fill,
      shadows: shadows.map(({ blur, spread }) => ({ blur, spread })),
      glowAt,
    });
  }
  return { shapes, glow };
}
