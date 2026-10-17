import { mixHex } from './look-engine';
import type { Palette } from './look-types';

/** How much of what is behind the bar still shows through it. */
const BAR_ALPHA = 0.97;

/**
 * The floating tab bar's fill. The prototype's glass is a thin tint over `blur(24px)`; drawn
 * without the blur, a dark look's 8% white is almost clear and the page shows straight through.
 * This lays the glass over the page's sheet (the bottom of the sky when the sheet is see-through),
 * the colour the blur would mostly show, and keeps the result nearly opaque. A glass that is
 * already solid is left as it is.
 */
export function barGlass(palette: Pick<Palette, 'glass' | 'sheetSolid' | 'st'>): string {
  const glass = parseColour(palette.glass);
  if (!glass || glass.alpha >= BAR_ALPHA) return palette.glass;
  const sheet = parseColour(palette.sheetSolid);
  const base = sheet && sheet.alpha >= 1 ? sheet.hex : palette.st[2];
  const over = mixHex(base, glass.hex, glass.alpha);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(over.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${BAR_ALPHA})`;
}

function parseColour(colour: string): { hex: string; alpha: number } | null {
  const hex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(colour.trim());
  if (hex) {
    const alpha = hex[2] === undefined ? 1 : parseInt(hex[2], 16) / 255;
    return { hex: `#${hex[1]}`, alpha };
  }
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(
    colour.trim(),
  );
  if (!rgba) return null;
  const channel = (v: string | undefined) => Math.round(Number(v)).toString(16).padStart(2, '0');
  return {
    hex: `#${channel(rgba[1])}${channel(rgba[2])}${channel(rgba[3])}`,
    alpha: rgba[4] === undefined ? 1 : Number(rgba[4]),
  };
}
