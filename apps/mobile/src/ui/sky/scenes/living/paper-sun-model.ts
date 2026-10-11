import { sunFor, type FrameInput, type Palette } from '@6pm/theme';

import {
  CLEAR,
  parseBoxShadows,
  parseColor,
  parseGradients,
  resolveStops,
  type RadialGradientValue,
  type Rgba,
} from '../../css-values';
import { baseSun } from '../../sun-geometry';

/** Where the hour-driven numbers sit in `PaperSunModel.values`. */
export const SUN_VALUE = {
  x: 0,
  y: 1,
  size: 2,
  opacity: 3,
  threadOpacity: 4,
  light: 5,
  body: 9,
  thread: 13,
  length: 17,
} as const;

export interface PaperSunModel {
  /** x as a fraction of the width, y and size in points, opacities, then the colours (RGBA). */
  readonly values: readonly number[];
  /** Where the focus of the face's gradient sits, as fractions of the disc's box. */
  readonly focus: { readonly x: number; readonly y: number };
  /** Where the face turns from its light centre to its body colour, as a fraction of the ray. */
  readonly bodyAt: number;
  /** The shadow the sun casts down onto the hills: offset, Gaussian σ and colour. */
  readonly cast: { readonly dy: number; readonly sigma: number; readonly color: Rgba };
  /** The shaded crescent inside the disc: its offset and colour. */
  readonly crescent: { readonly dx: number; readonly dy: number; readonly color: Rgba };
}

const HIDDEN: PaperSunModel = {
  values: new Array<number>(SUN_VALUE.length).fill(0),
  focus: { x: 0.5, y: 0.5 },
  bodyAt: 1,
  cast: { dy: 0, sigma: 0, color: CLEAR },
  crescent: { dx: 0, dy: 0, color: CLEAR },
};

export interface PaperSunInput extends FrameInput {
  readonly palette: Palette;
  /** The sun belongs to the Today tab only. */
  readonly showSun: boolean;
}

/**
 * Paper Diorama's sun as the prototype's `sunFx` styles it: a paper disc (light centre off to the
 * upper left) with a drop shadow and a shaded crescent, hung from a thread that runs to the top of
 * the screen. All numbers come from the look engine for the hour.
 */
export function paperSunModel({ palette, showSun, ...frame }: PaperSunInput): PaperSunModel {
  if (frame.look !== 'paper') return HIDDEN;
  const sun = sunFor(frame, palette, baseSun(frame.hour, palette, showSun, frame.serious));
  const face = parseGradients(typeof sun.color === 'string' ? sun.color : '').find(
    (g): g is RadialGradientValue => g.kind === 'radial',
  );
  if (!face) return HIDDEN;
  const stops = resolveStops(face.stops);
  const [light, body] = stops.colors;
  if (!light || !body) return HIDDEN;

  const shadows = parseBoxShadows(typeof sun.glow === 'string' ? sun.glow : 'none');
  const cast = shadows.find((s) => !s.inset);
  const crescent = shadows.find((s) => s.inset);
  const thread = parseColor(typeof sun.thread === 'string' ? sun.thread : '') ?? CLEAR;
  const opacity = Number(sun.opacity) || 0;

  const values = new Array<number>(SUN_VALUE.length).fill(0);
  values[SUN_VALUE.x] = sun.x;
  values[SUN_VALUE.y] = sun.y;
  values[SUN_VALUE.size] = sun.size;
  values[SUN_VALUE.opacity] = opacity;
  values[SUN_VALUE.threadOpacity] = Number(sun.threadOp) || 0;
  light.forEach((v, i) => (values[SUN_VALUE.light + i] = v));
  body.forEach((v, i) => (values[SUN_VALUE.body + i] = v));
  thread.forEach((v, i) => (values[SUN_VALUE.thread + i] = v));

  return {
    values,
    focus: { x: face.at[0], y: face.at[1] },
    bodyAt: stops.positions[1] ?? 1,
    cast: cast
      ? { dy: cast.y, sigma: cast.blur / 2, color: cast.color }
      : { dy: 0, sigma: 0, color: CLEAR },
    crescent: crescent
      ? { dx: crescent.x, dy: crescent.y, color: crescent.color }
      : { dx: 0, dy: 0, color: CLEAR },
  };
}
