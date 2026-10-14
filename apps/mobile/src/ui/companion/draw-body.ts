import { ClipOp, type SkCanvas, type SkPath } from '@shopify/react-native-skia';

import {
  INK,
  box,
  degrees,
  ellipse,
  fill,
  fillShader,
  jitter,
  pathBuilder,
  stroke,
  unitGradient,
  type Frame,
} from './draw-kit';

const BODY_POINTS = 22;
const WAVE_STEPS = 24;

export function drawGroundShadow(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, rx, hop } = fr;
  ellipse(
    canvas,
    fr,
    cx,
    s * 0.92,
    rx * (0.85 + hop / s),
    s * 0.03,
    0,
    fill(fr, 'rgba(30,10,30,0.16)'),
  );
}

export function drawFeet(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, ry, lw } = fr;
  const color = fr.plain
    ? '#8d848a'
    : fr.mx
      ? '#5a46c0'
      : fr.form === 'nhang'
        ? '#e9b949'
        : '#9b3f5f';
  const sides = [-1, 1];
  for (let n = 0; n < sides.length; n++) {
    const k = sides[n] ?? 1;
    const x = cx + k * s * 0.11 + jitter(fr, 90 + n, 0.003);
    ellipse(
      canvas,
      fr,
      x,
      cy + ry * 0.98,
      s * 0.062,
      s * 0.034,
      0,
      fill(fr, color),
      stroke(fr, INK, lw * 0.85),
    );
  }
}

/** Each form's arms, in its own body colour. */
const ARMS: Readonly<Record<string, string>> = {
  sun: '#ffb27c',
  max: '#ffc1d8',
  nhang: '#a9dcc6',
  banhbao: '#f9e9d2',
  giot: '#9fd8f7',
};

/** One arm: resting at the side, raised, or raised and waving. */
export function drawArm(canvas: SkCanvas, fr: Frame, side: number, up: boolean, wave = false) {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const ax = cx + side * rx * (up ? 0.92 : 1.02);
  const ay = up ? cy - ry * 0.32 : cy + ry * 0.18;
  const rot = wave ? side * (-1.1 + Math.sin(fr.el * 9) * 0.45) : side * (up ? -0.9 : 0.35);
  const color = fr.plain ? '#d6cec9' : (ARMS[fr.form] ?? '#ffb27c');
  canvas.save();
  canvas.translate(ax, ay);
  canvas.rotate(degrees(rot), 0, 0);
  ellipse(
    canvas,
    fr,
    0,
    up ? -s * 0.03 : 0,
    s * 0.045,
    s * 0.07,
    0,
    fill(fr, color),
    stroke(fr, INK, lw * 0.85),
  );
  canvas.restore();
}

/** The arms that hang behind the body: both, unless they are raised or waving. */
export function drawArmsBehind(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.mood === 'happy' || fr.mood === 'wave') return;
  drawArm(canvas, fr, -1, false);
  drawArm(canvas, fr, 1, false);
}

/** The arms over the body: both raised when happy, one waving and one resting for a wave. */
export function drawArmsInFront(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.mood === 'happy') {
    drawArm(canvas, fr, -1, true);
    drawArm(canvas, fr, 1, true);
  } else if (fr.mood === 'wave') {
    drawArm(canvas, fr, -1, false);
    drawArm(canvas, fr, 1, true, true);
  }
}

/** The round body, a little wider at the bottom, wobbling through quadratic midpoints. */
function bodyPath(fr: Frame): SkPath {
  'worklet';
  const { cx, cy, rx, ry } = fr;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < BODY_POINTS; i++) {
    const a = (i / BODY_POINTS) * Math.PI * 2;
    const sn = Math.sin(a);
    xs.push(cx + Math.cos(a) * rx * (1 + 0.07 * Math.max(0, sn)) + jitter(fr, i, 0.0045));
    ys.push(cy + sn * ry * (sn > 0 ? 0.96 : 1.04) + jitter(fr, i + 40, 0.0045));
  }
  const x = (i: number) => xs[(i + BODY_POINTS) % BODY_POINTS] ?? cx;
  const y = (i: number) => ys[(i + BODY_POINTS) % BODY_POINTS] ?? cy;
  const path = pathBuilder(fr);
  path.moveTo((x(-1) + x(0)) / 2, (y(-1) + y(0)) / 2);
  for (let i = 0; i < BODY_POINTS; i++) {
    path.quadTo(x(i), y(i), (x(i) + x(i + 1)) / 2, (y(i) + y(i + 1)) / 2);
  }
  path.close();
  return path.build();
}

/**
 * The horizon as a gently moving wave across the whole square. Closed below it is the sea, in the
 * space of the sea's gradient (the horizon at 0, the body's bottom at 1); open it is the line.
 */
function wavePath(fr: Frame, closeBelow: boolean): SkPath {
  'worklet';
  const { s, hz, el } = fr;
  const seaLength = fr.cy + fr.ry - hz;
  const path = pathBuilder(fr);
  if (closeBelow) path.moveTo(0, 0);
  for (let i = 0; i <= WAVE_STEPS; i++) {
    const x = (i * s) / WAVE_STEPS;
    const rise = Math.sin((x / s) * 14 + el * 2.4) * s * 0.008;
    if (closeBelow) path.lineTo(x, rise / seaLength);
    else if (i === 0) path.moveTo(x, hz + rise);
    else path.lineTo(x, hz + rise);
  }
  if (closeBelow) {
    path.lineTo(s, (s - hz) / seaLength);
    path.lineTo(0, (s - hz) / seaLength);
    path.close();
  }
  return path.build();
}

const SKY = {
  plain: { key: 'sky-plain', colors: ['#ece6e1', '#cfc6c0'], stops: [0, 1] },
  max: { key: 'sky-max', colors: ['#fff1c4', '#ffa8c8', '#b48cff'], stops: [0, 0.5, 1] },
  base: { key: 'sky-base', colors: ['#ffe2a6', '#ffb070', '#ff8a5c'], stops: [0, 0.55, 1] },
} as const;

const SEA = {
  plain: { key: 'sea-plain', colors: ['#a79ea4', '#8d848a'] },
  max: { key: 'sea-max', colors: ['#5a46c0', '#241a6e'] },
  base: { key: 'sea-base', colors: ['#e8607a', '#a8406c'] },
} as const;
const SEA_STOPS = [0, 1] as const;

function variantOf(fr: Frame): 'plain' | 'max' | 'base' {
  'worklet';
  return fr.plain ? 'plain' : fr.mx ? 'max' : 'base';
}

/**
 * Fills the square with a top-to-bottom gradient from `top` to `bottom`, through the one unit
 * gradient of its variant stretched to fit.
 */
export function fillGradient(
  canvas: SkCanvas,
  fr: Frame,
  key: string,
  colors: readonly string[],
  stops: readonly number[],
  top: number,
  bottom: number,
): void {
  'worklet';
  const length = bottom - top;
  canvas.save();
  canvas.translate(0, top);
  canvas.scale(1, length);
  canvas.drawRect(
    box(fr, 0, -top / length, fr.s, fr.s / length),
    fillShader(fr, unitGradient(fr, key, colors, stops)),
  );
  canvas.restore();
}

/** Glints on the water, and the Max form's twinkles under the horizon. */
function drawSeaLights(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, rx, ry, hz, el, lw } = fr;
  const sea = cy + ry - hz;
  if (!fr.plain) {
    const glint = stroke(fr, 'rgba(255,225,200,0.75)', lw * 0.55);
    const glints = [
      [0.12, 0.55, 0.07],
      [-0.14, 0.72, 0.05],
      [0.05, 0.86, 0.04],
    ];
    for (let n = 0; n < glints.length; n++) {
      const [ox = 0, oy = 0, w = 0] = glints[n] ?? [];
      const gx = cx + ox * s + Math.sin(el * 1.6 + n) * s * 0.01;
      const gy = hz + sea * oy - s * 0.02;
      canvas.drawLine(gx - (w * s) / 2, gy, gx + (w * s) / 2, gy, glint);
    }
  }
  if (fr.mx) {
    const twinkles = [
      [0.36, 0.3],
      [0.6, 0.55],
      [0.46, 0.8],
      [0.7, 0.25],
    ];
    for (let n = 0; n < twinkles.length; n++) {
      const [px = 0, py = 0] = twinkles[n] ?? [];
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(el * 2.2 + n * 1.7));
      const paint = fill(fr, '#fff0ff', alpha);
      canvas.drawCircle(cx - rx + px * rx * 2, hz + sea * py, s * 0.009, paint);
    }
  }
}

/** The body: sky-sun above, sea below, the horizon, highlights, then the outline. */
export function drawBody(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, rx, ry, hz, lw } = fr;
  const body = bodyPath(fr);

  canvas.save();
  canvas.clipPath(body, ClipOp.Intersect, true);
  const variant = variantOf(fr);
  const sky = SKY[variant];
  fillGradient(canvas, fr, sky.key, sky.colors, sky.stops, cy - ry, hz);

  const sea = SEA[variant];
  canvas.save();
  canvas.translate(0, hz);
  canvas.scale(1, cy + ry - hz);
  canvas.drawPath(
    wavePath(fr, true),
    fillShader(fr, unitGradient(fr, sea.key, sea.colors, SEA_STOPS)),
  );
  canvas.restore();
  const horizon = fr.plain ? 'rgba(60,50,60,0.35)' : 'rgba(90,20,50,0.45)';
  canvas.drawPath(wavePath(fr, false), stroke(fr, horizon, lw * 0.6));

  drawSeaLights(canvas, fr);

  const shine = fill(fr, 'rgba(255,255,255,0.55)');
  ellipse(canvas, fr, cx - rx * 0.48, cy - ry * 0.58, s * 0.05, s * 0.025, -0.6, shine);
  canvas.drawCircle(cx - rx * 0.22, cy - ry * 0.78, s * 0.011, shine);
  canvas.restore();

  canvas.drawPath(body, stroke(fr, INK, lw));
}
