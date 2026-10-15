import { oklchSrgbHex, planInk, type Palette } from '@6pm/theme';

import { withAlpha } from './plan-colours';

/**
 * The edit sheet's tints, as the prototype's revamped Edit pot draws them on a light sheet: the
 * cost panel washed in the pot's own hue while it fits and in amber while it is too fast, the
 * timeline striped amber where the plan does not fit and green in the pot's hue where it does.
 * Dark looks take the same hues as washes over the dark card.
 */
export function potSheetColours(palette: Palette, hue: number) {
  const dark = palette.dark;
  return {
    /** The cost panel while it fits (and for a paused, dateless or Future-you pot). */
    fitBg: dark ? withAlpha(oklchSrgbHex(0.72, 0.15, hue), 0.16) : oklchSrgbHex(0.96, 0.03, hue),
    fitInk: dark ? oklchSrgbHex(0.86, 0.1, hue) : oklchSrgbHex(0.38, 0.08, hue),
    fitBar: oklchSrgbHex(0.7, 0.13, hue),
    /** The cost panel while it is too fast. */
    warnBg: dark ? withAlpha(oklchSrgbHex(0.75, 0.14, 60), 0.22) : oklchSrgbHex(0.95, 0.04, 60),
    warnInk: dark ? planInk.warn.dark : oklchSrgbHex(0.43, 0.1, 50),
    /** The timeline: stripes where it does not fit, green where it does, the line between. */
    stripeA: dark ? withAlpha(oklchSrgbHex(0.88, 0.06, 55), 0.45) : oklchSrgbHex(0.88, 0.06, 55),
    stripeB: dark ? withAlpha(oklchSrgbHex(0.94, 0.035, 60), 0.18) : oklchSrgbHex(0.94, 0.035, 60),
    green: oklchSrgbHex(0.82, 0.1, hue),
    marker: dark ? oklchSrgbHex(0.86, 0.1, hue) : oklchSrgbHex(0.5, 0.11, hue),
    /** The unit keys' outline. */
    keyEdge: dark ? 'rgba(255,255,255,.2)' : 'rgba(27,30,46,.12)',
  };
}

export type PotSheetColours = ReturnType<typeof potSheetColours>;

/** The prototype's softer ink (.55 and .5 of the ink against `inkSoft`'s .62), as an opacity. */
export const FAINT = 0.55 / 0.62;
export const FAINTER = 0.5 / 0.62;
