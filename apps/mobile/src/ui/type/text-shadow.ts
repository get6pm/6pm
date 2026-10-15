import type { TextStyle } from 'react-native';

import { splitTopLevel } from '../sky/css-values';

/**
 * A CSS `text-shadow` list as React Native text shadows, one style per shadow: a text draws one
 * shadow, so a look's layered glow is drawn as stacked copies, bottom layer first (CSS lists the
 * top one first). `none` is empty.
 */
export function textShadows(css: string): TextStyle[] {
  if (css.trim() === 'none' || css.trim() === '') return [];
  return splitTopLevel(css)
    .flatMap((layer): TextStyle[] => {
      const parts = splitTopLevel(layer, ' ');
      const lengths = parts.filter((p) => /^-?[\d.]+(px)?$/.test(p)).map((p) => parseFloat(p));
      const color = parts.find((p) => !/^-?[\d.]+(px)?$/.test(p));
      if (!color) return [];
      const [x = 0, y = 0, blur = 0] = lengths;
      return [
        {
          textShadowColor: color,
          textShadowOffset: { width: x, height: y },
          textShadowRadius: blur,
        },
      ];
    })
    .reverse();
}

/** `'opsz' 22` → 22: the optical size a look pins a face to, or null for `normal`. */
export function pinnedOpticalSize(css: string): number | null {
  const m = /'opsz'\s+([\d.]+)/.exec(css);
  return m?.[1] ? Number(m[1]) : null;
}
