import { Platform, type TextStyle } from 'react-native';

/** Family names as the font files register them (tools/fonts/build_fonts.py). */
export const families = {
  display: 'BricolageGrotesque',
  body: Platform.select({ ios: undefined, default: 'BeVietnamPro-Regular' }),
  bodyMedium: Platform.select({ ios: undefined, default: 'BeVietnamPro-Medium' }),
  bodySemiBold: Platform.select({ ios: undefined, default: 'BeVietnamPro-SemiBold' }),
  bodyBold: Platform.select({ ios: undefined, default: 'BeVietnamPro-Bold' }),
  mono: 'IBMPlexMono-Regular',
  monoMedium: 'IBMPlexMono-Medium',
  monoSemiBold: 'IBMPlexMono-SemiBold',
  hand: 'PatrickHand-Regular',
  symbols: 'MaterialSymbolsRounded',
} as const;

/** The display face's optical-size range (the browser clamps optical size the same way). */
const OPSZ_MIN = 12;
const OPSZ_MAX = 96;

/**
 * How a display face is set: a variable file takes the weight on its axis (and Bricolage its optical
 * size); a static family has one file per weight.
 */
type DisplayFace =
  | { readonly family: string; readonly opsz: boolean }
  | { readonly byWeight: (weight: number) => string };

/** Each look's display face, keyed by the first family in the look's CSS `dispFont`. */
const FACES: Readonly<Record<string, DisplayFace>> = {
  'Bricolage Grotesque': { family: families.display, opsz: true },
  'Be Vietnam Pro': {
    byWeight: (w) => (w >= 600 ? 'BeVietnamPro-SemiBold' : 'BeVietnamPro-Medium'),
  },
  'Barlow Condensed': {
    byWeight: (w) => (w >= 600 ? 'BarlowCondensed-SemiBold' : 'BarlowCondensed-Medium'),
  },
  'Baloo 2': { family: 'Baloo2', opsz: false },
  Lora: { family: 'Lora', opsz: false },
  'Playfair Display': { family: 'PlayfairDisplay', opsz: false },
  'Cormorant Garamond': { family: 'CormorantGaramond', opsz: false },
  Unbounded: { family: 'Unbounded', opsz: false },
  'IBM Plex Mono': {
    byWeight: (w) =>
      w >= 600 ? families.monoSemiBold : w >= 500 ? families.monoMedium : families.mono,
  },
};
const BRICOLAGE = FACES['Bricolage Grotesque'] as DisplayFace;

/** "'Playfair Display', Georgia, serif" → the face 6pm ships for it (Bricolage when unknown). */
function faceOf(cssFont: string): DisplayFace {
  const first =
    cssFont
      .split(',')[0]
      ?.trim()
      .replace(/^['"]|['"]$/g, '') ?? '';
  return FACES[first] ?? BRICOLAGE;
}

let current: DisplayFace = BRICOLAGE;

/**
 * Sets the display face to the look's (`palette.dispFont`). The theme calls it as it renders, so
 * every display text drawn after a look change uses the new face.
 */
export function setDisplayFont(cssFont: string) {
  current = faceOf(cssFont);
}

/**
 * The look's display face at a size and weight, set the way the browser sets it: optical size
 * follows the font size (`font-optical-sizing: auto`) where the face has that axis, so a 92 pt hero
 * and a 21 pt card title each get the drawing made for their size. Letter spacing is in em, as the
 * prototype writes it. `cssFont` draws in another look's face (a look's preview card).
 */
export function display(
  size: number,
  weight = 500,
  letterSpacingEm = 0,
  cssFont?: string,
): TextStyle {
  const face = cssFont === undefined ? current : faceOf(cssFont);
  const spacing = { fontSize: size, letterSpacing: letterSpacingEm * size };
  if ('byWeight' in face) return { fontFamily: face.byWeight(weight), ...spacing };
  const opsz = Math.min(OPSZ_MAX, Math.max(OPSZ_MIN, size));
  return {
    fontFamily: face.family,
    fontVariationSettings: face.opsz ? `'opsz' ${opsz}, 'wght' ${weight}` : `'wght' ${weight}`,
    ...spacing,
  };
}

type BodyWeight = 400 | 500 | 550 | 600 | 650 | 700 | 800;

/**
 * The UI face: SF Pro on iOS (the prototype's -apple-system), Be Vietnam Pro elsewhere. iOS takes
 * the numeric weight directly; Be Vietnam Pro maps to its nearest static cut.
 */
export function body(size: number, weight: BodyWeight = 400, letterSpacingEm = 0): TextStyle {
  const ios = Platform.OS === 'ios';
  const fontWeight = String(
    Math.min(800, Math.round(weight / 100) * 100),
  ) as TextStyle['fontWeight'];
  const family = ios
    ? undefined
    : weight >= 700
      ? families.bodyBold
      : weight >= 600
        ? families.bodySemiBold
        : weight >= 500
          ? families.bodyMedium
          : families.body;
  // SF Pro is variable: an in-between weight (550, 650) is set on its axis, as the browser does.
  const between = ios && weight % 100 !== 0;
  return {
    ...(family ? { fontFamily: family } : {}),
    ...(ios ? { fontWeight } : {}),
    ...(between ? { fontVariationSettings: `'wght' ${weight}` } : {}),
    fontSize: size,
    letterSpacing: letterSpacingEm * size,
  };
}

/** IBM Plex Mono for kickers, receipts and stamps, usually uppercase and letter-spaced. */
export function mono(size: number, weight: 400 | 500 | 600 = 500, letterSpacingEm = 0): TextStyle {
  return {
    fontFamily:
      weight >= 600 ? families.monoSemiBold : weight >= 500 ? families.monoMedium : families.mono,
    fontSize: size,
    letterSpacing: letterSpacingEm * size,
  };
}

/** Tabular figures for amounts that change in place. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
