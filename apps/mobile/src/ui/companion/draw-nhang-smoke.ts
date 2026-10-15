import { type SkCanvas } from '@shopify/react-native-skia';

import { fill, linear, pathBuilder, stroke, strokeShader, type Frame } from './draw-kit';

/** Nhang's smoke: the ribbons from each ember and the shapes they curl into for a mood. */

export const SMOKE = '#a99cbc';
const SMOKE_FADE = ['rgba(169,156,188,0.95)', 'rgba(169,156,188,0)'];
const FADE_STOPS = [0, 1];
const RIBBON_STEPS = 12;
/** How high the smoke rises from an ember, as a share of the size. */
const SMOKE_RISE = 0.2;

/** The ribbon's sideways drift at height `t` (0 at the ember, 1 at the top). */
function ribbonX(fr: Frame, n: number, t: number, tipX: number): number {
  'worklet';
  const { s, cx, el, mood } = fr;
  if (mood === 'sleepy') return t * t * s * 0.13 + Math.sin(t * 4 - el * 0.8 + n) * s * 0.01 * t;
  // The outer ribbons lean in as they rise, so the three braid above the middle stick.
  const braid = (cx - tipX) * 0.7 * t * t;
  return braid + Math.sin(t * 6.5 - el * 1.7 + n * 2.1) * s * 0.022 * (0.3 + t);
}

/** One smoke ribbon from an ember, fading as it rises, `rise` of its full height. */
export function drawRibbon(
  canvas: SkCanvas,
  fr: Frame,
  n: number,
  x: number,
  y: number,
  rise: number,
) {
  'worklet';
  const height = fr.s * SMOKE_RISE;
  const path = pathBuilder(fr);
  path.moveTo(0, 0);
  let px = ribbonX(fr, n, 0, x);
  let py = 0;
  for (let i = 1; i <= RIBBON_STEPS; i++) {
    const t = (i / RIBBON_STEPS) * rise;
    const nx = ribbonX(fr, n, t, x);
    const ny = -t * height;
    if (i === 1) path.lineTo((px + nx) / 2, (py + ny) / 2);
    else path.quadTo(px, py, (px + nx) / 2, (py + ny) / 2);
    px = nx;
    py = ny;
  }
  path.lineTo(px, py);
  canvas.save();
  canvas.translate(x, y);
  const shader = linear(fr, `smoke-${fr.s}`, 0, 0, 0, -height, SMOKE_FADE, FADE_STOPS);
  canvas.drawPath(path.build(), strokeShader(fr, shader, Math.max(0.9, fr.lw * 0.6)));
  canvas.restore();
}

/** The happy heart of smoke over the middle stick, rising and thinning away. */
export function drawHeart(canvas: SkCanvas, fr: Frame, x: number, y: number) {
  'worklet';
  const { s, el, lw } = fr;
  const p = (el % 2.2) / 2.2;
  const r = s * 0.042 * (0.75 + 0.45 * p);
  const cx = x + Math.sin(p * 6) * s * 0.01;
  const cy = y - s * 0.09 - p * s * 0.06;
  const alpha = Math.min(1, p * 5) * Math.pow(1 - p, 1.2);
  const heart = pathBuilder(fr);
  heart.moveTo(cx, cy + r);
  heart.cubicTo(cx - r * 1.1, cy + r * 0.25, cx - r * 0.75, cy - r * 0.75, cx, cy - r * 0.2);
  heart.cubicTo(cx + r * 0.75, cy - r * 0.75, cx + r * 1.1, cy + r * 0.25, cx, cy + r);
  canvas.drawPath(heart.build(), stroke(fr, SMOKE, lw * 0.7 * (1 - 0.5 * p), alpha));
}

/** The thinking question mark of smoke, swaying over the middle stick. */
export function drawQuestion(canvas: SkCanvas, fr: Frame, x: number, y: number) {
  'worklet';
  const { s, el, lw } = fr;
  const r = s * 0.045;
  const sway = Math.sin(el * 1.5) * r * 0.25;
  const cx = x + s * 0.015;
  const cy = y - s * 0.1;
  const mark = pathBuilder(fr);
  mark.moveTo(cx - r * 0.55, cy - r * 0.45);
  mark.cubicTo(
    cx - r * 0.55,
    cy - r * 1.15,
    cx + r * 0.65,
    cy - r * 1.2,
    cx + r * 0.6,
    cy - r * 0.45,
  );
  mark.cubicTo(cx + r * 0.55 + sway, cy, cx + sway, cy - r * 0.05, cx, cy + r * 0.45);
  const alpha = 0.7 + 0.25 * Math.sin(el * 2);
  canvas.drawPath(mark.build(), stroke(fr, SMOKE, lw * 0.75, alpha));
  canvas.drawCircle(cx, cy + r * 0.95, r * 0.13, fill(fr, SMOKE, alpha));
}

/** Two Zs of smoke drifting off to the side while it sleeps. */
export function drawSleepZ(canvas: SkCanvas, fr: Frame, x: number, y: number) {
  'worklet';
  const { s, el, lw } = fr;
  for (let k = 0; k < 2; k++) {
    const p = (el * 0.33 + k * 0.5) % 1;
    const z = s * (0.03 + 0.022 * p);
    const zx = x + s * (0.1 + p * 0.22);
    const zy = y - s * 0.02 - p * s * 0.16;
    const path = pathBuilder(fr);
    path.moveTo(zx - z, zy - z);
    path.lineTo(zx + z, zy - z);
    path.lineTo(zx - z, zy + z);
    path.lineTo(zx + z, zy + z);
    canvas.drawPath(path.build(), stroke(fr, SMOKE, lw * 0.6, Math.sin(p * Math.PI) * 0.9));
  }
}
