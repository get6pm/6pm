import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import ALEGREYA from '../../../assets/fonts/Alegreya-Variable.ttf';
import BIG_SHOULDERS from '../../../assets/fonts/BigShouldersDisplay-Variable.ttf';
import VIET_MEDIUM from '../../../assets/fonts/BeVietnamPro-Medium.ttf';
import VIET_SEMIBOLD from '../../../assets/fonts/BeVietnamPro-SemiBold.ttf';
import BRICOLAGE from '../../../assets/fonts/BricolageGrotesque-Variable.ttf';
import DARKER from '../../../assets/fonts/DarkerGrotesque-Variable.ttf';
import DELA from '../../../assets/fonts/DelaGothicOne-Regular.ttf';
import GRANDSTANDER from '../../../assets/fonts/Grandstander-Variable.ttf';
import MONO_MEDIUM from '../../../assets/fonts/IBMPlexMono-Medium.ttf';
import MONO from '../../../assets/fonts/IBMPlexMono-Regular.ttf';
import MONO_SEMIBOLD from '../../../assets/fonts/IBMPlexMono-SemiBold.ttf';
import SYMBOLS from '../../../assets/fonts/MaterialSymbolsRounded-Variable.ttf';
import NEWSREADER from '../../../assets/fonts/Newsreader-Variable.ttf';
import HAND from '../../../assets/fonts/PatrickHand-Regular.ttf';
import PRATA from '../../../assets/fonts/Prata-Regular.ttf';
import SPECTRAL_MEDIUM from '../../../assets/fonts/Spectral-Medium.ttf';
import SPECTRAL from '../../../assets/fonts/Spectral-Regular.ttf';
import SPECTRAL_SEMIBOLD from '../../../assets/fonts/Spectral-SemiBold.ttf';
import TILT from '../../../assets/fonts/TiltNeon.ttf';

/** One `@font-face`: the CSS family, the weight (a range for a variable file) and the file. */
interface Face {
  readonly family: string;
  readonly weight: string;
  readonly asset: number;
}

const mono: readonly Face[] = [
  { family: 'IBM Plex Mono', weight: '400', asset: MONO },
  { family: 'IBM Plex Mono', weight: '500', asset: MONO_MEDIUM },
  { family: 'IBM Plex Mono', weight: '600', asset: MONO_SEMIBOLD },
];

/** What every page prints with, whatever the look: the mono, the hand and the icons. */
const ALWAYS: readonly Face[] = [
  ...mono,
  { family: 'Patrick Hand', weight: '400', asset: HAND },
  { family: 'Material Symbols Rounded', weight: '100 700', asset: SYMBOLS },
];

/** Each look's display face, keyed by the first family in the look's CSS `dispFont`. */
const DISPLAY: Readonly<Record<string, readonly Face[]>> = {
  'Bricolage Grotesque': [{ family: 'Bricolage Grotesque', weight: '200 800', asset: BRICOLAGE }],
  'Be Vietnam Pro': [
    { family: 'Be Vietnam Pro', weight: '500', asset: VIET_MEDIUM },
    { family: 'Be Vietnam Pro', weight: '600', asset: VIET_SEMIBOLD },
  ],
  // Drawn in Big Shoulders Display and Grandstander, which have Vietnamese.
  'Barlow Condensed': [{ family: 'Barlow Condensed', weight: '400 800', asset: BIG_SHOULDERS }],
  'Baloo 2': [{ family: 'Baloo 2', weight: '400 800', asset: GRANDSTANDER }],
  // Sơn Mài's Bodoni Moda is drawn in Prata, which has Vietnamese.
  'Bodoni Moda': [{ family: 'Bodoni Moda', weight: '400 700', asset: PRATA }],
  Newsreader: [{ family: 'Newsreader', weight: '400 700', asset: NEWSREADER }],
  'Dela Gothic One': [{ family: 'Dela Gothic One', weight: '400', asset: DELA }],
  'Darker Grotesque': [{ family: 'Darker Grotesque', weight: '400 800', asset: DARKER }],
  Alegreya: [{ family: 'Alegreya', weight: '400 800', asset: ALEGREYA }],
  'Tilt Neon': [{ family: 'Tilt Neon', weight: '400', asset: TILT }],
  Spectral: [
    { family: 'Spectral', weight: '400', asset: SPECTRAL },
    { family: 'Spectral', weight: '500', asset: SPECTRAL_MEDIUM },
    { family: 'Spectral', weight: '600', asset: SPECTRAL_SEMIBOLD },
  ],
  'IBM Plex Mono': [],
  /** The system face (Basic, Original): the web view has SF Pro itself. */
  '-apple-system': [],
};

function firstFamily(cssFont: string): string {
  return (
    cssFont
      .split(',')[0]
      ?.trim()
      .replace(/^['"]|['"]$/g, '') ?? ''
  );
}

/** The CSS font stack the book's display type is set in: the look's, or Bricolage when unknown. */
export function displayStack(cssFont: string): string {
  return firstFamily(cssFont) in DISPLAY
    ? cssFont
    : "'Bricolage Grotesque', ui-rounded, system-ui, sans-serif";
}

const loaded = new Map<number, Promise<string>>();

/** The font file as base64, read once from the app's bundled assets. */
function base64Of(asset: number): Promise<string> {
  let file = loaded.get(asset);
  if (!file) {
    file = Asset.fromModule(asset)
      .downloadAsync()
      .then((a) => new File(a.localUri ?? a.uri).base64());
    file.catch(() => loaded.delete(asset));
    loaded.set(asset, file);
  }
  return file;
}

/**
 * The `@font-face` rules the book's HTML needs, each font embedded as base64: the page is drawn in
 * a web view, which cannot see the fonts the app registered, and the PDF must carry its own type.
 */
export async function fontFaces(cssFont: string): Promise<string> {
  const faces = [
    ...ALWAYS,
    ...(DISPLAY[firstFamily(cssFont)] ?? DISPLAY['Bricolage Grotesque'] ?? []),
  ];
  const rules = await Promise.all(
    faces.map(
      async (f) =>
        `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:normal;` +
        `src:url(data:font/ttf;base64,${await base64Of(f.asset)}) format('truetype');}`,
    ),
  );
  return rules.join('\n');
}
