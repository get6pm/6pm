import { oklchSrgbHex } from '@6pm/theme';

/**
 * The Diary's fixed inks. Receipts, stamps and zines are paper, so they keep the same colours in
 * every look and at every hour, as the prototype draws them.
 */
export const paper = {
  sheet: '#fbf7ef',
  ink: '#2b2530',
  soft: 'rgba(43,37,48,.5)',
  rule: 'rgba(43,37,48,.35)',
  hand: '#4a3550',
  stamp: '#c0443a',
} as const;

export const zineInk = {
  ink: '#2a1424',
  light: '#fbf4ec',
  stamp: '#b5433a',
  track: 'rgba(42,20,36,.12)',
  grabber: 'rgba(42,20,36,.3)',
  noteBg: oklchSrgbHex(0.94, 0.08, 95),
  noteInk: '#3a2a40',
  switchOn: oklchSrgbHex(0.62, 0.15, 150),
  switchOff: 'rgba(42,20,36,.2)',
} as const;

/** The calendar's dots: under the line or over it. */
export const dots = {
  under: oklchSrgbHex(0.66, 0.14, 150),
  over: oklchSrgbHex(0.7, 0.15, 45),
  /** Darker, for dots printed on paper in the zine. */
  paperUnder: oklchSrgbHex(0.55, 0.13, 150),
  paperOver: oklchSrgbHex(0.62, 0.15, 45),
} as const;

/** The recap story's highlighted words. */
export function recapAccent(dark: boolean): string {
  return dark ? '#ffbe8a' : '#b8622a';
}

/** Lines and ghost fills that sit on the page's ink. */
export function inkWash(dark: boolean) {
  return {
    strongBar: dark ? 'rgba(255,255,255,.75)' : 'rgba(27,30,46,.7)',
    bar: dark ? 'rgba(255,255,255,.4)' : 'rgba(27,30,46,.35)',
    dashed: dark ? 'rgba(255,255,255,.28)' : 'rgba(27,30,46,.22)',
    shelfDashed: dark ? 'rgba(255,255,255,.3)' : 'rgba(27,30,46,.25)',
    todayFill: dark ? 'rgba(255,133,82,.14)' : 'rgba(255,133,82,.2)',
  };
}

/**
 * Each month's diary cover: a soft tint of its own hue. August and September are the designed
 * covers; the other months follow the same lightness around the wheel.
 */
const COVERS: readonly (readonly [number, number, number])[] = [
  [0.86, 0.07, 20],
  [0.86, 0.07, 350],
  [0.86, 0.07, 140],
  [0.86, 0.07, 100],
  [0.86, 0.07, 170],
  [0.86, 0.07, 210],
  [0.86, 0.07, 250],
  [0.85, 0.06, 300],
  [0.86, 0.07, 50],
  [0.86, 0.07, 25],
  [0.86, 0.07, 330],
  [0.86, 0.07, 190],
];

export function coverTint(month: string): string {
  const [l, c, h] = COVERS[(Number(month.slice(5, 7)) + 11) % 12] ?? [0.86, 0.07, 50];
  return oklchSrgbHex(l, c, h);
}
