import { ClipOp, type SkCanvas } from '@shopify/react-native-skia';

import { drawArmsBehind, drawArmsInFront, drawFeet, fillGradient } from './draw-body';
import { drawFace } from './draw-face';
import { INK, ellipse, fill, pathBuilder, stroke, type Frame } from './draw-kit';
import { SMOKE, drawHeart, drawQuestion, drawRibbon, drawSleepZ } from './draw-nhang-smoke';

/**
 * Nhang: a celadon incense urn with gold handles, a band of lotus petals and three incense sticks
 * for hair. Their embers glow brighter with each slow breath and their smoke braids lazily upward;
 * calm, a fleck of ash drifts down now and then. Happy, the embers blaze and spark and the smoke
 * curls into a heart; thinking, into a question mark; asleep it drifts off sideways in Zs. Waving,
 * the right stick waves; nodding, all three bow together.
 */

const URN = ['#dcf5e8', '#97d3b9', '#4f9481'];
const URN_STOPS = [0, 0.5, 1];
const GOLD = '#f2c45a';
const STICKS = [-0.34, 0, 0.34];
const PETALS = 3;
const ASH = [
  [-0.45, 0.004],
  [0.5, -0.004],
  [0.15, 0.008],
];
const RING_SECONDS = 1.8;

function rimY(fr: Frame): number {
  'worklet';
  return fr.cy - fr.ry * 0.78;
}

function rimHalf(fr: Frame): number {
  'worklet';
  return fr.rx * 0.86;
}

/** How far stick `n` leans from upright for this moment, in radians. */
function leanOf(fr: Frame, n: number): number {
  'worklet';
  const { el, mood } = fr;
  let a = (STICKS[n] ?? 0) * (mood === 'sleepy' ? 1.4 : 1) + Math.sin(el * 1.1 + n * 1.7) * 0.035;
  if (mood === 'wave' && n === 2) a = 0.55 + Math.sin(el * 8) * 0.45;
  if (mood === 'nod') a += Math.max(0, Math.sin(el * 2.6)) * 0.28;
  if (mood === 'happy') a += Math.sin(el * 5.2 + n) * 0.08;
  return a;
}

/** One ember: its halo, the coal and its bright heart, with happy sparks rising from it. */
function drawEmber(canvas: SkCanvas, fr: Frame, n: number, tx: number, ty: number) {
  'worklet';
  const { s, el, mood } = fr;
  const breath = 0.5 + 0.5 * Math.sin(el * 1.3 + n * 0.4);
  const glow = mood === 'sleepy' ? 0.15 + breath * 0.3 : mood === 'happy' ? 1 : breath;
  canvas.drawCircle(tx, ty, s * (0.026 + 0.012 * glow), fill(fr, '#ffb36b', 0.2 + 0.3 * glow));
  canvas.drawCircle(tx, ty, s * 0.013, fill(fr, '#ff7a2f'));
  canvas.drawCircle(tx, ty, s * 0.006, fill(fr, '#ffe2b8', 0.3 + 0.7 * glow));
  if (mood !== 'happy') return;
  for (let k = 0; k < 3; k++) {
    const p = (el * 1.1 + k / 3 + n * 0.21) % 1;
    const x = tx + Math.sin(p * 9 + k * 2 + n) * s * 0.022;
    const y = ty - s * 0.01 - p * s * 0.13;
    canvas.drawCircle(x, y, s * 0.009 * (1 - p) + 0.4, fill(fr, '#ffd27a', 1 - p));
  }
}

/** A fleck of ash falling from the left ember to the rim, once every five and a half seconds. */
function drawAshFleck(canvas: SkCanvas, fr: Frame, tx: number, ty: number) {
  'worklet';
  const p = (fr.el % 5.5) / 1.1;
  if (p >= 1) return;
  const { s } = fr;
  const x = tx + Math.sin(p * 7) * s * 0.012;
  const y = ty + p * (rimY(fr) - ty);
  ellipse(canvas, fr, x, y, s * 0.008, s * 0.005, p * 3, fill(fr, '#cfc6c0', 1 - p * 0.3));
}

/** The sticks, their embers and their smoke. */
function drawSticks(canvas: SkCanvas, fr: Frame) {
  'worklet';
  const { s, cx, lw, mood } = fr;
  const top = rimY(fr);
  const half = rimHalf(fr);
  for (let n = 0; n < STICKS.length; n++) {
    const mid = n === 1;
    const a = leanOf(fr, n);
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
    drawEmber(canvas, fr, n, tx, ty);
    if (mood === 'calm' && n === 0) drawAshFleck(canvas, fr, tx, ty);
    if (!mid) continue;
    if (mood === 'happy') drawHeart(canvas, fr, tx, ty);
    if (mood === 'think') drawQuestion(canvas, fr, tx, ty);
    if (mood === 'sleepy') drawSleepZ(canvas, fr, tx, ty);
  }
}

/** The two ring handles on the urn's shoulders: ink with a gold inlay. */
function drawHandles(canvas: SkCanvas, fr: Frame) {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  for (let k = -1; k <= 1; k += 2) {
    const x = cx + k * rx * 1.04;
    const y = cy - ry * 0.32;
    const r = s * 0.034;
    canvas.drawCircle(x, y, r, stroke(fr, INK, lw * 1.7));
    canvas.drawCircle(x, y, r, stroke(fr, GOLD, lw * 0.75));
  }
}

/** The gold band round the urn's belly, with its row of lotus petals. */
function drawBand(canvas: SkCanvas, fr: Frame) {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const band = cy + ry * 0.5;
  for (let i = -PETALS; i <= PETALS; i++) {
    const x = cx + i * rx * 0.3;
    const w = rx * 0.15;
    const shape = pathBuilder(fr);
    shape.moveTo(x - w, band);
    shape.quadTo(x, band - s * 0.065, x + w, band);
    const petal = shape.close().build();
    canvas.drawPath(petal, fill(fr, GOLD, 0.35));
    canvas.drawPath(petal, stroke(fr, GOLD, lw * 0.55));
  }
  canvas.drawLine(cx - rx * 1.2, band, cx + rx * 1.2, band, stroke(fr, GOLD, lw * 1.05));
  const under = band + lw * 1.5;
  canvas.drawLine(cx - rx * 1.2, under, cx + rx * 1.2, under, stroke(fr, GOLD, lw * 0.4));
}

/** The urn: celadon, a band of petals, a gold rim holding the ash the sticks stand in. */
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
  drawBand(canvas, fr);
  const shine = fill(fr, 'rgba(255,255,255,0.55)');
  ellipse(canvas, fr, cx - rx * 0.55, cy - ry * 0.3, s * 0.045, s * 0.022, -0.7, shine);
  canvas.drawCircle(cx - rx * 0.32, cy - ry * 0.52, s * 0.009, fill(fr, 'rgba(255,255,255,0.6)'));
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
  const speck = fill(fr, '#9a9096');
  for (const [ox = 0, oy = 0] of ASH) {
    canvas.drawCircle(cx + ox * half, top + oy * s, s * 0.0045, speck);
  }
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

/** Nhang inside the tilted group: feet, arms, handles, the urn, its sticks and smoke, the face. */
export function drawNhang(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  drawFeet(canvas, fr);
  drawArmsBehind(canvas, fr);
  drawHandles(canvas, fr);
  drawUrn(canvas, fr);
  drawSticks(canvas, fr);
  drawArmsInFront(canvas, fr);
  drawFace(canvas, fr);
}
