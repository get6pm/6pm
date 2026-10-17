import { Platform } from 'react-native';

/**
 * Every face the looks name, by the first family of the look's CSS font stack, as the app ships it
 * (tools/fonts/build_fonts.py): a variable file with the axes it keeps, a static family with one
 * file per weight, or the system face.
 */
export type Face =
  | { readonly kind: 'system' }
  | {
      readonly kind: 'variable';
      readonly family: string;
      /** The weight range the file keeps; a weight outside it is clamped, as the browser does. */
      readonly wght: readonly [number, number];
      /** The optical-size range, for faces that have the axis. */
      readonly opsz: readonly [number, number] | null;
      /**
       * Tracking, in em, that closes up the face's tabular figures where they are set far apart
       * for their shapes (the odometer's columns).
       */
      readonly figureTracking?: number;
    }
  | { readonly kind: 'static'; readonly byWeight: (weight: number) => string };

/**
 * The name a variable file is drawn by: iOS registers it under its family name, Android finds it
 * by its file name in assets/fonts (`BricolageGrotesque-Variable.ttf`).
 */
export function variableFamily(family: string): string {
  return Platform.OS === 'ios' ? family : `${family}-Variable`;
}

const variable = (
  family: string,
  wght: readonly [number, number],
  opsz: readonly [number, number] | null = null,
  figureTracking?: number,
): Face => ({
  kind: 'variable',
  family: variableFamily(family),
  wght,
  opsz,
  ...(figureTracking === undefined ? {} : { figureTracking }),
});

/** A static family: the cut nearest the weight asked for (the heavier one on a tie). */
function cuts(byWeight: Readonly<Record<number, string>>): Face {
  const weights = Object.keys(byWeight)
    .map(Number)
    .sort((a, b) => a - b);
  return {
    kind: 'static',
    byWeight: (w) => {
      let best = weights[0] ?? 400;
      for (const cut of weights) if (Math.abs(cut - w) <= Math.abs(best - w)) best = cut;
      return byWeight[best] ?? '';
    },
  };
}

const SYSTEM: Face = { kind: 'system' };
const BRICOLAGE = variable('BricolageGrotesque', [300, 800], [12, 96]);

const viet = (prefix: string) =>
  cuts({
    400: `${prefix}-Regular`,
    500: `${prefix}-Medium`,
    600: `${prefix}-SemiBold`,
    700: `${prefix}-Bold`,
  });

/** Faces a look sets its display type in (the hero number, headings). */
const DISPLAY: Readonly<Record<string, Face>> = {
  'Bricolage Grotesque': BRICOLAGE,
  'Be Vietnam Pro': cuts({ 500: 'BeVietnamPro-Medium', 600: 'BeVietnamPro-SemiBold' }),
  // Sơn Mài names Bodoni Moda, which has no Vietnamese (ơ, ư, ầ…): Prata, a Didone that does, draws it.
  'Bodoni Moda': cuts({ 400: 'Prata-Regular' }),
  Newsreader: variable('Newsreader', [400, 700], [6, 72]),
  'Dela Gothic One': cuts({ 400: 'DelaGothicOne-Regular' }),
  'Darker Grotesque': variable('DarkerGrotesque', [400, 800]),
  Alegreya: variable('Alegreya', [400, 800]),
  'Tilt Neon': cuts({ 400: 'TiltNeon' }),
  // Long Exposure and Paper Diorama name Barlow Condensed and Baloo 2; the app draws them in
  // newer faces with Vietnamese, Big Shoulders Display and Grandstander.
  'Barlow Condensed': variable('BigShouldersDisplay', [400, 800]),
  // Grandstander's tabular figures stand wide apart for their shapes; the odometer closes them up.
  'Baloo 2': variable('Grandstander', [400, 800], null, -0.07),
  Spectral: cuts({ 400: 'Spectral-Regular', 500: 'Spectral-Medium', 600: 'Spectral-SemiBold' }),
  'IBM Plex Mono': cuts({
    400: 'IBMPlexMono-Regular',
    500: 'IBMPlexMono-Medium',
    600: 'IBMPlexMono-SemiBold',
  }),
};

/** Faces a look sets its interface text in (labels, rows, buttons). */
const UI: Readonly<Record<string, Face>> = {
  Literata: variable('Literata', [400, 800], [7, 72]),
  Epilogue: variable('Epilogue', [400, 800]),
  Archivo: variable('Archivo', [400, 800]),
  'Plus Jakarta Sans': variable('PlusJakartaSans', [400, 800]),
  'Alegreya Sans': cuts({
    400: 'AlegreyaSans-Regular',
    500: 'AlegreyaSans-Medium',
    700: 'AlegreyaSans-Bold',
    800: 'AlegreyaSans-ExtraBold',
  }),
  'Bai Jamjuree': viet('BaiJamjuree'),
  // Long Exposure's Barlow and Paper Diorama's Nunito are drawn in Geist and Lexend.
  Barlow: variable('Geist', [400, 800]),
  Nunito: variable('Lexend', [400, 800]),
  'Be Vietnam Pro': viet('BeVietnamPro'),
};

/** "'Literata', Georgia, serif" → "Literata". */
export function firstFamily(cssFont: string): string {
  return (
    cssFont
      .split(',')[0]
      ?.trim()
      .replace(/^['"]|['"]$/g, '') ?? ''
  );
}

const isSystem = (family: string) =>
  family === '-apple-system' || family === 'system-ui' || family.startsWith('SF Pro');

/**
 * The face 6pm ships for a look's CSS font stack. The system stack (`-apple-system`) is SF Pro; an
 * unknown display face falls back to Bricolage Grotesque, an unknown interface face to SF Pro.
 */
export function faceOf(cssFont: string, role: 'display' | 'ui'): Face {
  const first = firstFamily(cssFont);
  if (isSystem(first)) return SYSTEM;
  if (role === 'display') return DISPLAY[first] ?? BRICOLAGE;
  return UI[first] ?? DISPLAY[first] ?? SYSTEM;
}
