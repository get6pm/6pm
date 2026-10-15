import { ImageFormat, Skia, matchFont } from '@shopify/react-native-skia';

import type { CompanionForm } from '../../ui/companion/companion-mood';
import { drawCompanion } from '../../ui/companion/draw-companion';
import { makeFrame } from '../../ui/companion/make-frame';

/** The moods the surfaces show: the widgets follow the hour, a waiting payment thinks. */
export const SURFACE_MOODS = ['calm', 'happy', 'wave', 'nod', 'sleepy', 'think'] as const;
export type SurfaceMood = (typeof SURFACE_MOODS)[number];

/**
 * Each picture a surface draws, in points: the small widget's (36) and the large one's title (22)
 * in every mood the hour can bring; the waiting payment's Dynamic Island (24, 26, 46) and Lock
 * Screen (52); the share card's (40) and the Siri snippet's (44).
 */
const SURFACE_PICTURES: readonly (readonly [SurfaceMood, number])[] = [
  ...(['calm', 'happy', 'wave', 'nod', 'sleepy'] as const).flatMap((mood) => [
    [mood, 22] as const,
    [mood, 36] as const,
  ]),
  ['think', 24],
  ['think', 26],
  ['think', 46],
  ['think', 52],
  ['calm', 40],
  ['happy', 44],
];
/** Drawn at @3× so the picture is sharp on every iPhone. */
const SCALE = 3;
/** The same still moment the app holds with Reduce Motion: eyes open, settled. */
const STILL_SECONDS = 2.6;
const SETTLED_SECONDS = 99;

/** `companion-calm-44`: the file name Swift reads from the App Group's surfaces folder. */
export function companionImageName(mood: SurfaceMood, size: number): string {
  return `companion-${mood}-${size}`;
}

/** One still companion as a PNG, base64, drawn off screen with the app's own drawing. */
export function renderCompanion(
  mood: SurfaceMood,
  size: number,
  form: CompanionForm,
): string | null {
  const pixels = size * SCALE;
  const surface = Skia.Surface.Make(pixels, pixels);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  canvas.scale(SCALE, SCALE);
  const fonts = {
    large: matchFont({
      fontFamily: 'Georgia',
      fontStyle: 'italic',
      fontSize: Math.round(size * 0.2),
    }),
    small: matchFont({
      fontFamily: 'Georgia',
      fontStyle: 'italic',
      fontSize: Math.round(size * 0.13),
    }),
  };
  const frame = makeFrame({
    s: size,
    el: STILL_SECONDS,
    since: SETTLED_SECONDS,
    sinceF: SETTLED_SECONDS,
    mood,
    form,
    seed: 1,
  });
  drawCompanion(canvas, frame, fonts);
  surface.flush();
  return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100);
}

/** Every picture the surfaces need, by file name. */
export function renderCompanions(form: CompanionForm): { name: string; png: string }[] {
  const out: { name: string; png: string }[] = [];
  for (const [mood, size] of SURFACE_PICTURES) {
    const png = renderCompanion(mood, size, form);
    if (png !== null) out.push({ name: companionImageName(mood, size), png });
  }
  return out;
}
