import { ClipOp, type SkCanvas, type SkPath } from '@shopify/react-native-skia';

import { drawArmsBehind, drawArmsInFront, fillGradient } from './draw-body';
import { drawFace } from './draw-face';
import { INK, ellipse, fill, oval, pathBuilder, stroke, type Frame } from './draw-kit';
import { puddleOf, splitPhase } from './companion-shape';

/**
 * Giọt: a glossy monsoon raindrop. It wobbles like jelly and winks; happy, it hops with a ripple
 * at each landing and now and then splits into two small drops that orbit it once and merge back;
 * asleep it melts into a puddle and gathers itself up again.
 */

const WATER = ['#e3f7ff', '#8fd3f7', '#3f93dc'];
const WATER_STOPS = [0, 0.45, 1];
const RIPPLE = '#6cbcea';
const SPLASH_SECONDS = 1.3;

function tipX(fr: Frame): number {
  'worklet';
  const lean = fr.mood === 'think' ? fr.s * 0.03 : 0;
  return fr.cx + Math.sin(fr.el * 2.3) * fr.s * 0.018 + lean;
}

function tipY(fr: Frame): number {
  'worklet';
  const melt = fr.mood === 'sleepy' ? puddleOf(fr.el) : 0;
  return fr.cy - fr.ry * (1.72 - 0.75 * melt);
}

function dropPath(fr: Frame): SkPath {
  'worklet';
  const { cx, cy, rx, ry } = fr;
  const tx = tipX(fr);
  const ty = tipY(fr);
  const path = pathBuilder(fr);
  path.moveTo(tx, ty);
  path.cubicTo(tx + rx * 0.12, ty + ry * 0.45, cx + rx, cy - ry * 0.7, cx + rx, cy);
  path.cubicTo(cx + rx, cy + ry * 0.56, cx + rx * 0.56, cy + ry, cx, cy + ry);
  path.cubicTo(cx - rx * 0.56, cy + ry, cx - rx, cy + ry * 0.56, cx - rx, cy);
  path.cubicTo(cx - rx, cy - ry * 0.7, tx - rx * 0.12, ty + ry * 0.45, tx, ty);
  path.close();
  return path.build();
}

/** The drop: water, the light gathered at its bottom, its gloss and its outline. */
function drawDrop(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const drop = dropPath(fr);
  canvas.save();
  canvas.clipPath(drop, ClipOp.Intersect, true);
  fillGradient(canvas, fr, 'water', WATER, WATER_STOPS, tipY(fr), cy + ry);
  ellipse(
    canvas,
    fr,
    cx + rx * 0.12,
    cy + ry * 0.66,
    rx * 0.62,
    ry * 0.2,
    0,
    fill(fr, '#d2f6ff', 0.6),
  );
  canvas.restore();
  canvas.drawPath(drop, stroke(fr, INK, lw));
  const gloss = stroke(fr, '#ffffff', lw * 1.05, 0.85);
  canvas.drawArc(oval(fr, cx, cy, rx * 0.72, ry * 0.72), 196, 52, false, gloss);
  canvas.drawCircle(cx - rx * 0.06, cy - ry * 0.74, s * 0.011, fill(fr, '#ffffff', 0.85));
}

/** One of the two small drops of a happy split, with a dot of a face. */
function drawMini(canvas: SkCanvas, fr: Frame, x: number, y: number, r: number): void {
  'worklet';
  const { s, lw } = fr;
  const path = pathBuilder(fr);
  path.moveTo(x, y - r * 1.6);
  path.cubicTo(x + r * 0.2, y - r * 1.1, x + r, y - r * 0.6, x + r, y);
  path.cubicTo(x + r, y + r * 0.55, x + r * 0.55, y + r, x, y + r);
  path.cubicTo(x - r * 0.55, y + r, x - r, y + r * 0.55, x - r, y);
  path.cubicTo(x - r, y - r * 0.6, x - r * 0.2, y - r * 1.1, x, y - r * 1.6);
  const mini = path.close().build();
  canvas.drawPath(mini, fill(fr, '#8fd3f7'));
  canvas.drawPath(mini, stroke(fr, INK, Math.max(0.8, lw * 0.7)));
  const eye = fill(fr, INK);
  canvas.drawCircle(x - r * 0.35, y, Math.max(0.6, s * 0.008), eye);
  canvas.drawCircle(x + r * 0.35, y, Math.max(0.6, s * 0.008), eye);
}

/** The two small drops, behind the big one (`front` false) or in front of it. */
function drawSplit(canvas: SkCanvas, fr: Frame, front: boolean): void {
  'worklet';
  if (fr.mood !== 'happy') return;
  const phase = splitPhase(fr.el);
  if (phase < 0) return;
  const apart = Math.sin(phase * Math.PI);
  const r = fr.s * 0.085 * apart;
  if (r < fr.s * 0.015) return;
  for (let k = 0; k < 2; k++) {
    const a = phase * Math.PI * 2 + k * Math.PI;
    if (Math.sin(a) > 0 !== front) continue;
    const x = fr.cx + Math.cos(a) * fr.rx * (1.15 + 0.45 * apart);
    const y = fr.cy - fr.ry * 0.1 + Math.sin(a) * fr.ry * 0.35;
    drawMini(canvas, fr, x, y, r);
  }
}

/** One ripple ring on the ground, `p` of the way out. */
function ripple(canvas: SkCanvas, fr: Frame, p: number, strength: number): void {
  'worklet';
  if (p < 0 || p >= 1) return;
  const r = fr.rx * (0.7 + p * 0.9);
  const paint = stroke(fr, RIPPLE, Math.max(0.7, fr.lw * 0.6), (1 - p) * strength);
  ellipse(canvas, fr, fr.cx, fr.s * 0.905, r, r * 0.18, 0, paint);
}

/** Ripples where it lands: at every happy hop, after a mood change, and the splash of arriving. */
export function drawRipples(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.mood === 'happy') ripple(canvas, fr, ((fr.el * 5.2) / Math.PI) % 1, 0.7);
  ripple(canvas, fr, fr.since / 0.9, 0.6);
  ripple(canvas, fr, fr.sinceF / SPLASH_SECONDS, 0.9);
  ripple(canvas, fr, (fr.sinceF - 0.25) / SPLASH_SECONDS, 0.7);
}

/** Four small droplets thrown up when Giọt is chosen. */
export function drawSplash(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.sinceF < 0 || fr.sinceF >= SPLASH_SECONDS) return;
  const { s, cx } = fr;
  const p = fr.sinceF / SPLASH_SECONDS;
  const paint = fill(fr, '#8fd3f7', 1 - p);
  const outline = stroke(fr, INK, Math.max(0.6, fr.lw * 0.5), 1 - p);
  for (let n = 0; n < 4; n++) {
    const side = n < 2 ? -1 : 1;
    const reach = n % 2 === 0 ? 0.36 : 0.24;
    const x = cx + side * s * reach * p;
    const y = s * 0.86 - Math.sin(p * Math.PI) * s * (n % 2 === 0 ? 0.16 : 0.24);
    const r = s * 0.018 * (1 - p * 0.5);
    canvas.drawCircle(x, y, r, paint);
    canvas.drawCircle(x, y, r, outline);
  }
}

/** Giọt inside the tilted group: the small drops behind, arms, the drop, face, small drops in front. */
export function drawGiot(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  drawSplit(canvas, fr, false);
  drawArmsBehind(canvas, fr);
  drawDrop(canvas, fr);
  drawArmsInFront(canvas, fr);
  drawFace(canvas, fr);
  drawSplit(canvas, fr, true);
}
