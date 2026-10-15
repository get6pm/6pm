import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkCanvas,
  type SkColor,
  type SkPaint,
  type SkPathBuilder,
  type SkRect,
  type SkShader,
} from '@shopify/react-native-skia';

import type { CompanionForm, CompanionMood } from './companion-mood';

/** The companion's outline colour: every stroke and the eyes. */
export const INK = '#3a1d2a';

/**
 * What one runtime keeps between frames so a frame allocates nothing: parsed colours, a pool of
 * paints and path builders handed out in order and taken back at the next frame, the gradients
 * that never change and one rectangle that is refilled for each oval.
 */
export interface Kit {
  readonly colors: Map<string, SkColor>;
  readonly paints: SkPaint[];
  readonly shaded: boolean[];
  readonly builders: SkPathBuilder[];
  readonly shaders: Map<string, SkShader>;
  readonly rect: { x: number; y: number; width: number; height: number };
  paintAt: number;
  builderAt: number;
}

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
  /** The form drawn: the sun whenever it is plain. */
  readonly form: CompanionForm;
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
  readonly kit: Kit;
}

/** The kit of the runtime asking, kept on that runtime's global and shared by every companion. */
export function kitOfRuntime(): Kit {
  'worklet';
  // A global is the only place a worklet keeps state between calls; the kit never leaves its runtime.
  const holder = globalThis as unknown as { __companionKit?: Kit };
  holder.__companionKit ??= {
    colors: new Map(),
    paints: [],
    shaded: [],
    builders: [],
    shaders: new Map(),
    rect: { x: 0, y: 0, width: 0, height: 0 },
    paintAt: 0,
    builderAt: 0,
  };
  return holder.__companionKit;
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

function colorOf(kit: Kit, color: string): SkColor {
  'worklet';
  let parsed = kit.colors.get(color);
  if (!parsed) {
    parsed = Skia.Color(color);
    kit.colors.set(color, parsed);
  }
  return parsed;
}

/** The next paint of the pool, reset to a plain filled one: valid until the frame ends. */
function nextPaint(kit: Kit): SkPaint {
  'worklet';
  const at = kit.paintAt++;
  let paint = kit.paints[at];
  if (!paint) {
    paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeJoin(StrokeJoin.Round);
    kit.paints[at] = paint;
    kit.shaded[at] = false;
  } else if (kit.shaded[at]) {
    paint.setShader(null);
    kit.shaded[at] = false;
  }
  paint.setStyle(PaintStyle.Fill);
  // Gradients never set a colour, and the paint's alpha multiplies them: a slot must not keep the
  // alpha of whatever drew with it last.
  paint.setAlphaf(1);
  return paint;
}

export function fill(fr: Frame, color: string, alpha = 1): SkPaint {
  'worklet';
  const paint = nextPaint(fr.kit);
  const parsed = colorOf(fr.kit, color);
  paint.setColor(parsed);
  if (alpha !== 1) paint.setAlphaf((parsed[3] ?? 1) * alpha);
  return paint;
}

export function stroke(fr: Frame, color: string, width: number, alpha = 1): SkPaint {
  'worklet';
  const paint = fill(fr, color, alpha);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  return paint;
}

/** A paint that fills with a gradient. */
export function fillShader(fr: Frame, shader: SkShader): SkPaint {
  'worklet';
  const paint = nextPaint(fr.kit);
  paint.setShader(shader);
  fr.kit.shaded[fr.kit.paintAt - 1] = true;
  return paint;
}

/** A paint that strokes with a gradient. */
export function strokeShader(fr: Frame, shader: SkShader, width: number): SkPaint {
  'worklet';
  const paint = fillShader(fr, shader);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  return paint;
}

/** A linear gradient between two points, clamped past its ends like the canvas one; built once. */
export function linear(
  fr: Frame,
  key: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colors: readonly string[],
  stops: readonly number[],
): SkShader {
  'worklet';
  const { kit } = fr;
  let shader = kit.shaders.get(key);
  if (!shader) {
    shader = Skia.Shader.MakeLinearGradient(
      { x: x0, y: y0 },
      { x: x1, y: y1 },
      colors.map((c) => colorOf(kit, c)),
      [...stops],
      TileMode.Clamp,
    );
    kit.shaders.set(key, shader);
  }
  return shader;
}

/** A gradient over the unit interval, built once: draw it under a canvas moved and scaled to fit. */
export function unitGradient(
  fr: Frame,
  key: string,
  colors: readonly string[],
  stops: readonly number[],
): SkShader {
  'worklet';
  return linear(fr, key, 0, 0, 0, 1, colors, stops);
}

/**
 * A radial gradient over the unit circle about the origin, built once: draw it under a canvas
 * moved to its centre and scaled to its radius.
 */
export function unitRadial(
  fr: Frame,
  key: string,
  colors: readonly string[],
  stops: readonly number[],
): SkShader {
  'worklet';
  const { kit } = fr;
  let shader = kit.shaders.get(key);
  if (!shader) {
    shader = Skia.Shader.MakeRadialGradient(
      { x: 0, y: 0 },
      1,
      colors.map((c) => colorOf(kit, c)),
      [...stops],
      TileMode.Clamp,
    );
    kit.shaders.set(key, shader);
  }
  return shader;
}

/** A new, empty path builder from the pool: valid until the frame ends. */
export function pathBuilder(fr: Frame): SkPathBuilder {
  'worklet';
  const { kit } = fr;
  const at = kit.builderAt++;
  const existing = kit.builders[at];
  if (existing) return existing.reset();
  const made = Skia.PathBuilder.Make();
  kit.builders[at] = made;
  return made;
}

/** The pooled rectangle, refilled: use it at once. */
export function oval(fr: Frame, x: number, y: number, rx: number, ry: number): SkRect {
  'worklet';
  const { rect } = fr.kit;
  rect.x = x - rx;
  rect.y = y - ry;
  rect.width = rx * 2;
  rect.height = ry * 2;
  return rect;
}

/** The pooled rectangle, refilled: use it at once. */
export function box(fr: Frame, x: number, y: number, width: number, height: number): SkRect {
  'worklet';
  const { rect } = fr.kit;
  rect.x = x;
  rect.y = y;
  rect.width = width;
  rect.height = height;
  return rect;
}

/** An ellipse, optionally turned by `rotation` radians about its centre, with each paint in turn. */
export function ellipse(
  canvas: SkCanvas,
  fr: Frame,
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
  for (const paint of paints) canvas.drawOval(oval(fr, x, y, rx, ry), paint);
  if (rotation !== 0) canvas.restore();
}
