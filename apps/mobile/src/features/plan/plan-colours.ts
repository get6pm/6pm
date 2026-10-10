import { oklchSrgbHex, type Palette } from '@6pm/theme';

import type { RiverSegment } from '@6pm/domain';

/** `#rrggbb` at an alpha, for the prototype's `oklch(… / a)` tints. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Ink on the accent (the payday marker), as on the scan button. */
export const ON_ACCENT = '#2a1424';

/**
 * The Plan tab's colours, exactly as the prototype's `pd()` sets them for the frame's palette:
 * the river, the day bars, the ok / behind chips and the dashed "New pot" outline.
 */
export function planColours(palette: Palette) {
  const dark = palette.dark;
  const river: Record<RiverSegment, string> = {
    bills: dark ? '#b7a5d8' : '#6d5a8f',
    futureYou: oklchSrgbHex(0.76, 0.13, 150),
    occasions: oklchSrgbHex(0.76, 0.12, 300),
    spent: dark ? 'rgba(255,255,255,.3)' : 'rgba(27,30,46,.22)',
    free: palette.accent,
  };
  return {
    river,
    chipOn: dark ? 'rgba(255,255,255,.2)' : 'rgba(27,30,46,.12)',
    barToday: palette.accent,
    barWeekend: dark ? 'rgba(255,133,82,.55)' : 'rgba(214,120,60,.45)',
    barDay: dark ? 'rgba(255,255,255,.3)' : 'rgba(27,30,46,.2)',
    warn: dark ? '#ffbe8a' : '#9a4f1c',
    ok: dark ? oklchSrgbHex(0.86, 0.12, 150) : oklchSrgbHex(0.45, 0.12, 150),
    okBg: withAlpha(oklchSrgbHex(0.72, 0.15, 150), 0.18),
    behindBg: withAlpha(oklchSrgbHex(0.75, 0.14, 60), 0.22),
    ringFill: oklchSrgbHex(0.76, 0.13, 150),
    ringTrack: dark ? 'rgba(255,255,255,.12)' : 'rgba(27,30,46,.08)',
    autoTile: oklchSrgbHex(0.76, 0.13, 150),
    autoGlyph: oklchSrgbHex(0.3, 0.08, 150),
    dashLine: dark ? 'rgba(255,255,255,.28)' : 'rgba(27,30,46,.22)',
    // The browser's range track the prototype's slider draws on.
    trackFill: dark ? '#3b3b3b' : '#efefef',
    trackEdge: dark ? '#858585' : '#767676',
    pickBorder: dark ? 'rgba(255,255,255,.22)' : 'rgba(27,30,46,.16)',
  };
}

export type PlanColours = ReturnType<typeof planColours>;

/** A bill's marker on the timeline: a mid tint of its hue with the deep tint on top. */
export function markerTint(hue: number) {
  return { bg: oklchSrgbHex(0.8, 0.11, hue), fg: oklchSrgbHex(0.3, 0.09, hue) };
}

/** An occasion card's jar: the fill rising from the bottom and its top edge. */
export function jarTint(hue: number, dark: boolean) {
  return {
    fill: withAlpha(oklchSrgbHex(0.78, 0.12, hue), dark ? 0.24 : 0.3),
    edge: oklchSrgbHex(0.76, 0.13, hue),
  };
}

/** A swatch in the New pot colour row. */
export function swatch(hue: number): string {
  return oklchSrgbHex(0.78, 0.12, hue);
}
