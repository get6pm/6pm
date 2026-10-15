/** A spend's category tile, as the app draws it: a soft gradient in one hue. */
export const tileGradient = (hue: number): string =>
  `linear-gradient(155deg, oklch(0.9 0.07 ${hue}), oklch(0.78 0.12 ${hue}))`;

/** The icon on a category tile, a deep shade of the same hue. */
export const glyphColor = (hue: number): string => `oklch(0.34 0.09 ${hue})`;
