import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkCanvas,
  type SkPaint,
  type SkRect,
  type SkShader,
} from '@shopify/react-native-skia';

import type { CompanionForm, CompanionMood } from './companion-mood';

/** The companion's outline colour: every stroke and the eyes. */
export const INK = '#3a1d2a';

/** Everything one frame of the companion is drawn from, in points of a `s`-sized square. */
export interface Frame {
  readonly s: number;
  /** Seconds of idle motion (bob, blink, rays, waves). */
  readonly el: number;
  /** Seconds since the mood last changed. */
  readonly since: number;
  /** Seconds since the form last changed. */
  readonly sinceF: number;
  readonly mood: CompanionMood;
  readonly plain: boolean;
  /** The Max form: ring, moons, star rays and sparkles. */
  readonly mx: boolean;
  /** Base stroke width. */
  readonly lw: number;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  /** The horizon: where the sky-sun meets the sea inside the body. */
  readonly hz: number;
  readonly hop: number;
  readonly tilt: number;
  readonly seed: number;
  /** The hand-drawn wobble re-rolls six times a second. */
  readonly tick: number;
}

export interface FrameInput {
  readonly s: number;
  readonly el: number;
  readonly since: number;
  readonly sinceF: number;
  readonly mood: CompanionMood;
  readonly form: CompanionForm;
  readonly seed: number;
}

/** The body's size, bob, hop and tilt for this moment. */
export function makeFrame({ s, el, since, sinceF, mood, form, seed }: FrameInput): Frame {
  'worklet';
  const plain = mood === 'plain';
  const breathe = mood === 'sleepy' ? Math.sin(el * 1.4) * 0.035 : Math.sin(el * 2.2) * 0.02;
  let hop = 0;
  let tilt = 0;
  if (mood === 'happy') hop = -Math.abs(Math.sin(el * 5.2)) * s * (since < 1.2 ? 0.08 : 0.025);
  if (mood === 'nod') tilt = Math.sin(el * 2.6) * 0.08;
  if (mood === 'think') tilt = -0.07;
  if (mood === 'wave') tilt = Math.sin(el * 2) * 0.03;
  const ry = s * 0.28 * (1 + breathe);
  const cy = s * 0.57 + hop - breathe * s * 0.1;
  return {
    s,
    el,
    since,
    sinceF,
    mood,
    plain,
    mx: form === 'max' && !plain,
    lw: Math.max(1.3, s * 0.034),
    cx: s / 2,
    cy,
    rx: s * 0.3,
    ry,
    hz: cy + ry * 0.3,
    hop,
    tilt,
    seed,
    tick: Math.floor(el * 6),
  };
}

/** A small hand-drawn wobble, stable for one tick, of up to `amount` × size. */
export function jitter(fr: Frame, i: number, amount: number): number {
  'worklet';
  const x = Math.sin(i * 127.1 + fr.tick * 311.7 + fr.seed) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amount * fr.s;
}

export function degrees(radians: number): number {
  'worklet';
  return (radians * 180) / Math.PI;
}

export function fill(color: string, alpha = 1): SkPaint {
  'worklet';
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  if (alpha !== 1) paint.setAlphaf(paint.getAlphaf() * alpha);
  return paint;
}

export function stroke(color: string, width: number, alpha = 1): SkPaint {
  'worklet';
  const paint = fill(color, alpha);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  return paint;
}

/** A linear gradient between two points, clamped past its ends like the canvas one. */
export function linear(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colors: readonly string[],
  stops: readonly number[],
): SkShader {
  'worklet';
  return Skia.Shader.MakeLinearGradient(
    { x: x0, y: y0 },
    { x: x1, y: y1 },
    colors.map((c) => Skia.Color(c)),
    [...stops],
    TileMode.Clamp,
  );
}

export function oval(x: number, y: number, rx: number, ry: number): SkRect {
  'worklet';
  return Skia.XYWHRect(x - rx, y - ry, rx * 2, ry * 2);
}

/** An ellipse, optionally turned by `rotation` radians about its centre, with each paint in turn. */
export function ellipse(
  canvas: SkCanvas,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation: number,
  ...paints: SkPaint[]
): void {
  'worklet';
  if (rotation !== 0) {
    canvas.save();
    canvas.rotate(degrees(rotation), x, y);
  }
  for (const paint of paints) canvas.drawOval(oval(x, y, rx, ry), paint);
  if (rotation !== 0) canvas.restore();
}
