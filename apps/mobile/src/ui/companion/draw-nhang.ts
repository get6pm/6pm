import { ClipOp, type SkCanvas } from '@shopify/react-native-skia';

import { drawArmsBehind, drawArmsInFront, drawFeet, fillGradient } from './draw-body';
import { drawFace } from './draw-face';
import {
  INK,
  ellipse,
  fill,
  linear,
  pathBuilder,
  stroke,
  strokeShader,
  type Frame,
} from './draw-kit';

/**
 * Nhang: a celadon incense urn whose three hairs are incense sticks. Their embers glow brighter
 * with each slow breath and their smoke braids lazily upward; happy, the smoke curls into a heart,
 * thinking into a question mark, asleep it drifts off sideways in Zs.
 */

const SMOKE = '#a99cbc';
const SMOKE_FADE = ['rgba(169,156,188,0.95)', 'rgba(169,156,188,0)'];
const FADE_STOPS = [0, 1];
const URN = ['#d4f0e2', '#97d3b9', '#5b9f8b'];
const URN_STOPS = [0, 0.5, 1];
const GOLD = '#f2c45a';
const STICKS = [-0.34, 0, 0.34];
const RIBBON_STEPS = 12;
/** How high the smoke rises from an ember, as a share of the size. */
const SMOKE_RISE = 0.2;
const RING_SECONDS = 1.8;

function rimY(fr: Frame): number {
  'worklet';
  return fr.cy - fr.ry * 0.78;
}

function rimHalf(fr: Frame): number {
  'worklet';
  return fr.rx * 0.86;
}

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
function drawRibbon(canvas: SkCanvas, fr: Frame, n: number, x: number, y: number, rise: number) {
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
function drawHeart(canvas: SkCanvas, fr: Frame, x: number, y: number) {
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
function drawQuestion(canvas: SkCanvas, fr: Frame, x: number, y: number) {
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
function drawSleepZ(canvas: SkCanvas, fr: Frame, x: number, y: number) {
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

/** The sticks, their embers and their smoke. */
function drawSticks(canvas: SkCanvas, fr: Frame) {
  'worklet';
  const { s, cx, el, lw, mood } = fr;
  const top = rimY(fr);
  const half = rimHalf(fr);
  for (let n = 0; n < STICKS.length; n++) {
    const mid = n === 1;
    const lean = (STICKS[n] ?? 0) * (mood === 'sleepy' ? 1.4 : 1);
    const a = lean + Math.sin(el * 1.1 + n * 1.7) * 0.035;
    const length = s * (mid ? 0.2 : 0.165);
    const bx = cx + (n - 1) * half * 0.32;
    const by = top + s * 0.008;
    const tx = bx + Math.sin(a) * length;
    const ty = by - Math.cos(a) * length;
    const shaped = mid && (mood === 'happy' || mood === 'think');
    const rise = mood === 'sleepy' ? 0.55 : shaped ? 0.4 : 1;
    drawRibbon(canvas, fr, n, tx, ty, rise);
    const width = Math.max(1, lw * 0.62);
    const hx = bx + (tx - bx) * 0.35;
    const hy = by + (ty - by) * 0.35;
    canvas.drawLine(bx, by, hx, hy, stroke(fr, '#c23b32', width));
    canvas.drawLine(hx, hy, tx, ty, stroke(fr, '#7a4a33', width));
    const breath = 0.5 + 0.5 * Math.sin(el * 1.3 + n * 0.4);
    const glow = mood === 'sleepy' ? 0.15 + breath * 0.3 : breath;
    canvas.drawCircle(tx, ty, s * (0.026 + 0.012 * glow), fill(fr, '#ffb36b', 0.2 + 0.3 * glow));
    canvas.drawCircle(tx, ty, s * 0.013, fill(fr, '#ff7a2f'));
    canvas.drawCircle(tx, ty, s * 0.006, fill(fr, '#ffe2b8', 0.3 + 0.7 * glow));
    if (!mid) continue;
    if (mood === 'happy') drawHeart(canvas, fr, tx, ty);
    if (mood === 'think') drawQuestion(canvas, fr, tx, ty);
    if (mood === 'sleepy') drawSleepZ(canvas, fr, tx, ty);
  }
}

/** The urn: celadon, a gold band, a gold rim holding the ash the sticks stand in. */
function drawUrn(canvas: SkCanvas, fr: Frame) {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const top = rimY(fr);
  const half = rimHalf(fr);
  const shape = pathBuilder(fr);
  shape.moveTo(cx - half, top);
  shape.cubicTo(
    cx - rx * 1.18,
    cy - ry * 0.25,
    cx - rx * 1.02,
    cy + ry * 0.92,
    cx - rx * 0.42,
    cy + ry,
  );
  shape.lineTo(cx + rx * 0.42, cy + ry);
  shape.cubicTo(cx + rx * 1.02, cy + ry * 0.92, cx + rx * 1.18, cy - ry * 0.25, cx + half, top);
  shape.close();
  const urn = shape.build();
  canvas.save();
  canvas.clipPath(urn, ClipOp.Intersect, true);
  fillGradient(canvas, fr, 'urn', URN, URN_STOPS, top, cy + ry);
  const band = cy + ry * 0.48;
  canvas.drawLine(cx - rx * 1.2, band, cx + rx * 1.2, band, stroke(fr, GOLD, lw * 1.1));
  canvas.drawLine(
    cx - rx * 1.2,
    band + lw * 1.4,
    cx + rx * 1.2,
    band + lw * 1.4,
    stroke(fr, GOLD, lw * 0.4),
  );
  const shine = fill(fr, 'rgba(255,255,255,0.5)');
  ellipse(canvas, fr, cx - rx * 0.55, cy - ry * 0.3, s * 0.045, s * 0.022, -0.7, shine);
  canvas.restore();
  canvas.drawPath(urn, stroke(fr, INK, lw));
  ellipse(
    canvas,
    fr,
    cx,
    top,
    half * 1.08,
    s * 0.042,
    0,
    fill(fr, GOLD),
    stroke(fr, INK, lw * 0.85),
  );
  ellipse(canvas, fr, cx, top - s * 0.003, half * 0.86, s * 0.022, 0, fill(fr, '#ddd5cc'));
}

/** A ring of smoke rising from the rim when Nhang is chosen. */
export function drawSmokeRing(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, lw } = fr;
  for (let k = 0; k < 2; k++) {
    const t = fr.sinceF - k * 0.3;
    if (t < 0 || t >= RING_SECONDS) continue;
    const p = t / RING_SECONDS;
    const r = s * (0.14 + 0.16 * p);
    const y = rimY(fr) - p * s * 0.42;
    const alpha = Math.pow(1 - p, 1.3) * 0.9;
    ellipse(canvas, fr, cx, y, r, r * 0.28, 0, stroke(fr, SMOKE, lw * (1.4 - 0.9 * p), alpha));
  }
}

/** Nhang inside the tilted group: feet, arms, the urn, its sticks and smoke, then the face. */
export function drawNhang(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  drawFeet(canvas, fr);
  drawArmsBehind(canvas, fr);
  drawUrn(canvas, fr);
  drawSticks(canvas, fr);
  drawArmsInFront(canvas, fr);
  drawFace(canvas, fr);
}
