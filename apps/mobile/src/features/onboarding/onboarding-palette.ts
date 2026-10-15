import { categoryTile, mixHex, oklchSrgbHex } from '@6pm/theme';

import { parseColor } from '../../ui/sky/css-values';

/**
 * Onboarding's own sky and inks, exactly as the onboarding prototype computes them: its sky runs
 * from a pale morning to dusk across the eight steps (`t` = step ÷ 7), and the screen turns dark
 * once `t` passes 0.7. These are not a look: onboarding happens before a look is chosen.
 */
const SKY_STOPS: readonly (readonly [number, string, string, string])[] = [
  [0, '#9fb3d4', '#d9dce8', '#f3dccb'],
  [0.3, '#9cc6ec', '#d4e7f6', '#f4efe6'],
  [0.6, '#8fa9d6', '#e1c9c2', '#f3c495'],
  [0.82, '#5d5c9c', '#d48a8c', '#f5ae70'],
  [1, '#2f2a5e', '#b7577a', '#ee8f55'],
];

/** The same stops as Skia colours (0–1 channels), for the UI-thread tween between steps. */
const SKY_RGBA: readonly (readonly number[][])[] = SKY_STOPS.map(([, ...colours]) =>
  colours.map((c) => [...(parseColor(c) ?? [0, 0, 0, 1])]),
);
const SKY_AT: readonly number[] = SKY_STOPS.map(([at]) => at);

export const STEP_COUNT = 9;

export function stepProgress(step: number): number {
  return step / (STEP_COUNT - 1);
}

function segment(t: number): { i: number; u: number } {
  'worklet';
  let i = 0;
  while (i < SKY_AT.length - 2 && t > (SKY_AT[i + 1] ?? 1)) i++;
  const a = SKY_AT[i] ?? 0;
  const b = SKY_AT[i + 1] ?? 1;
  return { i, u: Math.max(0, Math.min(1, (t - a) / (b - a))) };
}

/** The sky's three gradient colours (top, 55%, bottom) at progress `t`, as hex. */
export function skyAt(t: number): [string, string, string] {
  const { i, u } = segment(t);
  const a = SKY_STOPS[i] ?? SKY_STOPS[0];
  const b = SKY_STOPS[i + 1] ?? a;
  if (!a || !b) return ['#000000', '#000000', '#000000'];
  return [mixHex(a[1], b[1], u), mixHex(a[2], b[2], u), mixHex(a[3], b[3], u)];
}

/** The same colours as Skia colours, for a worklet following an animated `t`. */
export function skyRgbaAt(t: number): number[][] {
  'worklet';
  const { i, u } = segment(t);
  const a = SKY_RGBA[i] ?? [];
  const b = SKY_RGBA[i + 1] ?? a;
  const out: number[][] = [];
  for (let k = 0; k < 3; k++) {
    const ca = a[k] ?? [0, 0, 0, 1];
    const cb = b[k] ?? ca;
    out.push(ca.map((v, c) => v + ((cb[c] ?? v) - v) * u));
  }
  return out;
}

const GREEN = oklchSrgbHex(0.76, 0.13, 150);

/** `#rrggbb` at an alpha, for the prototype's `oklch(… / a)` tints. */
function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  // Rounded: a tiny alpha would otherwise print in exponent form, which is not a CSS colour.
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.round(alpha * 1000) / 1000})`;
}

/** Every ink and surface onboarding draws with, for one step. */
export function onboardingPalette(step: number) {
  const t = stepProgress(step);
  const sky = skyAt(t);
  const dark = t > 0.7;
  return {
    t,
    dark,
    sky,
    ink: dark ? '#fbf4ec' : '#1b1e2e',
    inkSoft: dark ? 'rgba(251,244,236,.74)' : 'rgba(27,30,46,.64)',
    btnBg: dark ? '#fbf4ec' : '#1b1e2e',
    btnFg: dark ? '#26182f' : '#fbf4ec',
    cell: dark ? mixHex(sky[2], '#2b2138', 0.8) : '#fffdf9',
    chipBg: dark ? 'rgba(255,255,255,.09)' : 'rgba(70,45,30,.06)',
    /** The payday segment that is on. */
    segOn: dark ? 'rgba(255,255,255,.16)' : '#ffffff',
    segShadow: '0 1px 3px rgba(0,0,0,.12)',
    cardShadow: dark
      ? 'inset 0 1px 0 rgba(255,255,255,.05), 0 10px 26px rgba(4,0,10,.28)'
      : '0 1px 2px rgba(70,45,30,.06), 0 10px 26px rgba(70,45,30,.08)',
    track: dark ? 'rgba(255,255,255,.16)' : 'rgba(27,30,46,.12)',
    ringTrack: dark ? 'rgba(255,255,255,.12)' : 'rgba(27,30,46,.08)',
    notifBg: dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.72)',
    green: GREEN,
    greenSoft: withAlpha(GREEN, 0.18),
    okInk: dark ? oklchSrgbHex(0.86, 0.1, 150) : oklchSrgbHex(0.42, 0.1, 150),
    /** The warm accent: picked bank tiles, the last step's button. */
    accent: '#f6a46a',
    /** The accent at zero alpha, so a border fades in without passing through grey. */
    accentClear: 'rgba(246,164,106,0)',
    onAccent: '#2a1424',
    accentShadow: '0 12px 30px rgba(240,130,80,.4), inset 0 1px 0 rgba(255,255,255,.5)',
    bills: dark ? '#b7a5d8' : '#6d5a8f',
    /** The check badge on the end-of-bills card. */
    doneBadge: GREEN,
    doneBadgeInk: '#173322',
    /** Text on the leaving overlay and on monogram tiles. */
    light: '#fbf4ec',
    white: '#ffffff',
  };
}

export type OnboardingPalette = ReturnType<typeof onboardingPalette>;

/** The tile behind an icon: two tints of a hue at 155° with the glyph in its deep tint. */
export function tileOf(hue: number): { background: string; glyph: string } {
  const tile = categoryTile(hue);
  return {
    background: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
    glyph: tile.glyph,
  };
}

/** The sun's two moods: a pale morning disc, and a warm one from 60% of the way to dusk. */
export const SUN = {
  cool: { core: '#fffaf0', rim: '#fff0cc', glow: 'rgba(255,246,220,.55)', blur: 100, spread: 40 },
  warm: { core: '#ffe2b0', rim: '#ffb26e', glow: 'rgba(255,160,100,.4)', blur: 140, spread: 70 },
} as const;

/**
 * The capture demos are small pictures of other screens (a camera, a share sheet, a mail list,
 * the Lock Screen), so they keep their own fixed colours at every step.
 */
export const DEMO = {
  scanBg: '#16131d',
  scanStripes: ['#1b1823', '#1f1c28'],
  scanPaper: '#f6efe6',
  scanLabelBg: 'rgba(251,244,236,.94)',
  scanLabelInk: '#2a1424',
  scanLine: '#f6a46a',
  scanGlow: '0 0 12px 2px rgba(246,164,106,.7)',
  shareBg: '#ece7e0',
  paperInk: '#1f1a28',
  receipt: '#ffffff',
  receiptShadow: '0 4px 14px rgba(40,25,20,.08)',
  rule: 'rgba(31,26,40,.1)',
  shareSheet: 'rgba(255,255,255,.85)',
  tapRing: [246 / 255, 164 / 255, 106 / 255],
  mailBg: '#e9edf3',
  mailGrab: '#2f9e5b',
  mailShopee: '#e2552c',
  addressBg: '#1f1a28',
  addressInk: '#fbf4ec',
  lockBg: 'linear-gradient(180deg, #2c2758 0%, #7a3f72 55%, #e0855a 100%)',
  lockInk: '#ffffff',
  lockRingTrack: 'rgba(255,255,255,.25)',
  lockRingCore: 'rgba(60,35,80,.9)',
  lockWidget: 'rgba(255,255,255,.18)',
  lockButton: 'rgba(20,12,30,.45)',
  walletBg: '#16131d',
  walletCard: 'linear-gradient(135deg, #3b3358 0%, #7a3f72 60%, #e0855a 100%)',
  walletCardInk: '#ffffff',
  walletCardShadow: '0 10px 24px rgba(0,0,0,.45)',
  bannerBg: 'rgba(246,242,248,.95)',
  bannerShadow: '0 6px 18px rgba(0,0,0,.3)',
  voiceBg: '#efe8f1',
  voiceBubble: '#ffffff',
} as const;

/** The welcome's three horizon lines under the companion. */
export const HORIZON = [
  { inset: '15%', top: 18, color: 'rgba(255,226,200,.6)' },
  { inset: '28%', top: 36, color: 'rgba(255,226,200,.5)' },
  { inset: '38%', top: 54, color: 'rgba(255,226,200,.4)' },
] as const;

/** The leaving overlay: the sky's top to bottom colour at that step. */
export function leaveGradient(step: number): string {
  const [top, , bottom] = skyAt(stepProgress(step));
  return `linear-gradient(180deg, ${top}, ${bottom})`;
}
