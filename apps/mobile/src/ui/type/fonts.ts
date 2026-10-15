import { Platform, type TextStyle } from 'react-native';

import { faceOf, type Face } from './faces';

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

const BRICOLAGE_CSS = "'Bricolage Grotesque', ui-rounded, system-ui, sans-serif";
const SYSTEM_CSS = '-apple-system';

let currentDisplay: Face = faceOf(BRICOLAGE_CSS, 'display');
let currentUi: Face = faceOf(SYSTEM_CSS, 'ui');

/**
 * Sets the display face to the look's (`palette.dispFont`). The theme calls it as it renders, so
 * every display text drawn after a look change uses the new face.
 */
export function setDisplayFont(cssFont: string) {
  currentDisplay = faceOf(cssFont, 'display');
}

/**
 * Sets the interface face to the look's (`palette.uiFont`): SF Pro for the looks that keep the
 * system's type (Basic, Golden Hour, serious mode), the look's own text face for the rest.
 */
export function setUiFont(cssFont: string) {
  currentUi = faceOf(cssFont, 'ui');
}

/** The numeric `fontWeight` iOS takes, rounded to a hundred as the system face is drawn. */
function systemWeight(weight: number): TextStyle['fontWeight'] {
  return String(
    Math.min(900, Math.max(100, Math.round(weight / 100) * 100)),
  ) as TextStyle['fontWeight'];
}

/**
 * A face at a size and weight, set the way the browser sets it: a variable face takes the exact
 * weight on its axis and, where it has one, the optical size of the font size
 * (`font-optical-sizing: auto`); a static family picks its nearest cut; the system face (SF Pro)
 * takes the weight natively, an in-between weight (550, 650) on its axis.
 */
function setIn(face: Face, size: number, weight: number): TextStyle {
  switch (face.kind) {
    case 'system': {
      if (Platform.OS !== 'ios')
        return { fontFamily: families.body, fontWeight: systemWeight(weight) };
      const between = weight % 100 !== 0;
      return {
        fontWeight: systemWeight(weight),
        ...(between ? { fontVariationSettings: `'wght' ${weight}` } : {}),
      };
    }
    case 'static':
      return { fontFamily: face.byWeight(weight) };
    case 'variable': {
      const wght = Math.min(face.wght[1], Math.max(face.wght[0], weight));
      const opsz = face.opsz ? Math.min(face.opsz[1], Math.max(face.opsz[0], size)) : null;
      return {
        fontFamily: face.family,
        fontVariationSettings: opsz === null ? `'wght' ${wght}` : `'opsz' ${opsz}, 'wght' ${wght}`,
      };
    }
  }
}

/**
 * The look's display face at a size and weight. Letter spacing is in em, as the prototype writes
 * it. `cssFont` draws in another look's face (a look's preview card).
 */
export function display(
  size: number,
  weight = 500,
  letterSpacingEm = 0,
  cssFont?: string,
): TextStyle {
  const face = cssFont === undefined ? currentDisplay : faceOf(cssFont, 'display');
  return { ...setIn(face, size, weight), fontSize: size, letterSpacing: letterSpacingEm * size };
}

type BodyWeight = 400 | 500 | 550 | 600 | 650 | 700 | 800;

/**
 * The look's interface face: SF Pro on iOS (the prototype's -apple-system) unless the look names
 * its own text face, Be Vietnam Pro elsewhere. `cssFont` sets another look's face (a preview).
 */
export function body(
  size: number,
  weight: BodyWeight = 400,
  letterSpacingEm = 0,
  cssFont?: string,
): TextStyle {
  const face = cssFont === undefined ? currentUi : faceOf(cssFont, 'ui');
  if (face.kind === 'system' && Platform.OS !== 'ios') {
    const family =
      weight >= 700
        ? families.bodyBold
        : weight >= 600
          ? families.bodySemiBold
          : weight >= 500
            ? families.bodyMedium
            : families.body;
    return { fontFamily: family, fontSize: size, letterSpacing: letterSpacingEm * size };
  }
  return { ...setIn(face, size, weight), fontSize: size, letterSpacing: letterSpacingEm * size };
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
