import { oklchSrgbHex, paperInk, planInk, zineInk } from '@6pm/theme';

/** The Diary's fixed inks live in the theme package; the Diary reads them under its own names. */
export const paper = paperInk;
export { zineInk };

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
  return dark ? planInk.recapWord.dark : planInk.recapWord.light;
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
