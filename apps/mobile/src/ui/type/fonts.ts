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

/** The display face's axis ranges (the browser clamps optical size the same way). */
const OPSZ_MIN = 12;
const OPSZ_MAX = 96;

/**
 * The display face at a size and weight, set the way the browser sets it: optical size follows the
 * font size (`font-optical-sizing: auto`), so a 92 pt hero and a 21 pt card title each get the
 * drawing made for their size. Letter spacing is given in em, as the prototype writes it.
 */
export function display(size: number, weight = 500, letterSpacingEm = 0): TextStyle {
  const opsz = Math.min(OPSZ_MAX, Math.max(OPSZ_MIN, size));
  return {
    fontFamily: families.display,
    fontSize: size,
    fontVariationSettings: `'opsz' ${opsz}, 'wght' ${weight}`,
    letterSpacing: letterSpacingEm * size,
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
