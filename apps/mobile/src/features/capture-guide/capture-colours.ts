import { planInk, type Palette } from '@6pm/theme';

import { planColours } from '../plan/plan-colours';

/** The capture rows' and guide's colours, as the prototype sets them for the frame's palette. */
export function captureColours(palette: Palette) {
  const plan = planColours(palette);
  return {
    ok: plan.ok,
    okBg: plan.okBg,
    warn: plan.warn,
    warnBg: plan.behindBg,
    /** "To review" on a waiting spend. */
    warnText: palette.dark ? planInk.recapWord.dark : planInk.recapWord.light,
    /** The "Catch Apple Pay taps too" banner: the house orange, washed. */
    fixBg: palette.dark ? 'rgba(255,133,82,.14)' : 'rgba(255,133,82,.2)',
    onAccent: planInk.onAccent,
  };
}
