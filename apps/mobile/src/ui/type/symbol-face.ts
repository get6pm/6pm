import type { TextStyle } from 'react-native';

import { MISSING_CURRENCY_GLYPHS } from './currency-glyphs.generated';

/** The weight a display style asks for: its variable `wght`, else 500 as `display` defaults. */
function weightOf(style: TextStyle): number {
  const axes = style.fontVariationSettings;
  if (axes && typeof axes === 'object' && 'wght' in axes) return Number(axes.wght);
  const wght = typeof axes === 'string' ? /'wght'\s+(\d+)/.exec(axes)?.[1] : undefined;
  return wght ? Number(wght) : 500;
}

/** Whether a text style's face can draw every character of a currency symbol. */
export function faceDraws(style: TextStyle, symbol: string): boolean {
  const missing = style.fontFamily ? MISSING_CURRENCY_GLYPHS[style.fontFamily] : undefined;
  if (!missing) return true;
  return ![...symbol].some((c) => missing.includes(c));
}

/**
 * The style to set a currency symbol in: the look's own face when it has the glyphs, else the
 * system face at the same size and weight (as iOS would borrow it, but chosen, so every character
 * of the symbol comes from one face).
 */
export function symbolStyle(style: TextStyle, symbol: string): TextStyle {
  if (faceDraws(style, symbol)) return style;
  const { fontFamily: _family, fontVariationSettings: _axes, ...rest } = style;
  const weight = Math.min(900, Math.max(100, Math.round(weightOf(style) / 100) * 100));
  return { ...rest, fontWeight: String(weight) as TextStyle['fontWeight'] };
}
