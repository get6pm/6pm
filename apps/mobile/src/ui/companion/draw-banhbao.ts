import { ClipOp, type SkCanvas, type SkPath } from '@shopify/react-native-skia';

import { drawArmsBehind, drawArmsInFront, fillGradient } from './draw-body';
import { drawFace } from './draw-face';
import { INK, ellipse, fill, jitter, pathBuilder, stroke, type Frame } from './draw-kit';
import { drawSnore, drawSteam, knotY } from './draw-banhbao-steam';
import { jiggle } from './companion-shape';

/**
 * Bánh Bao: a soft steamed bun sitting in a bamboo steamer, pleated into a top knot with a red
 * dot. It squashes when it lands and jiggles as it settles, puffs up and settles as it breathes,
 * lets little clouds of steam out of its knot, and twists its pleats when it waves.
 */

const DOUGH = ['#fffbf2', '#fbeedb', '#efd3ae'];
const DOUGH_STOPS = [0, 0.55, 1];
const BAMBOO = ['#efc27e', '#d29a52', '#b47a38'];
const BAMBOO_STOPS = [0, 0.5, 1];
const SLAT = '#9b6630';
const PLEAT = '#d2a578';
const POINTS = 24;
const PLEATS = 7;

/** A point on the bun's edge: a tall soft dome over a flat, slightly spread bottom. */
function edgeX(fr: Frame, i: number): number {
  'worklet';
  const a = (i / POINTS) * Math.PI * 2;
  const sn = Math.sin(a);
  return fr.cx + Math.cos(a) * fr.rx * (sn > 0 ? 1.04 : 1) + jitter(fr, i, 0.004);
}

function edgeY(fr: Frame, i: number): number {
  'worklet';
  const a = (i / POINTS) * Math.PI * 2;
  const sn = Math.sin(a);
  const y = sn > 0 ? fr.ry * 0.92 * Math.pow(sn, 0.45) : sn * fr.ry * 1.12;
  return fr.cy + y + jitter(fr, i + 40, 0.004);
}

function bunPath(fr: Frame): SkPath {
  'worklet';
  const path = pathBuilder(fr);
  const last = POINTS - 1;
  path.moveTo((edgeX(fr, last) + edgeX(fr, 0)) / 2, (edgeY(fr, last) + edgeY(fr, 0)) / 2);
  for (let i = 0; i < POINTS; i++) {
    const x = edgeX(fr, i);
    const y = edgeY(fr, i);
    const next = (i + 1) % POINTS;
    path.quadTo(x, y, (x + edgeX(fr, next)) / 2, (y + edgeY(fr, next)) / 2);
  }
  path.close();
  return path.build();
}

/**
 * How far the pleats twist about the knot: a wave winds them, a landing shakes them, a thought
 * turns them slowly, a happy hop shakes them quickly.
 */
function twistOf(fr: Frame): number {
  'worklet';
  const { mood, el, since, sinceF } = fr;
  let twist = jiggle(since, 14) * 0.25 + jiggle(sinceF, 12) * 0.35;
  if (mood === 'wave') twist += Math.sin(el * 9) * 0.32;
  if (mood === 'think') twist += 0.18 + Math.sin(el * 0.9) * 0.08;
  if (mood === 'calm') twist += Math.sin(el * 1.1) * 0.05;
  if (mood === 'happy') twist += Math.sin(el * 10.4) * 0.12;
  return twist;
}

/** The pleats, curving from around the dome up into the knot. */
function drawPleats(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const twist = twistOf(fr);
  const ky = knotY(fr) + s * 0.012;
  const line = stroke(fr, PLEAT, Math.max(0.8, lw * 0.6));
  for (let n = 0; n < PLEATS; n++) {
    const a = Math.PI * (1.1 + (n / (PLEATS - 1)) * 0.8);
    const fx = cx + Math.cos(a) * rx * 0.66;
    const fy = cy + Math.sin(a) * ry * 0.48;
    const bend = (fx - cx) * 0.4 + twist * s * 0.09;
    const path = pathBuilder(fr);
    path.moveTo(fx, fy);
    path.quadTo((fx + cx) / 2 + bend, (fy + ky) / 2 - ry * 0.14, cx + twist * s * 0.012, ky);
    canvas.drawPath(path.build(), line);
  }
}

/** The knot at the top and its red dot. */
function drawKnot(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, lw } = fr;
  const twist = twistOf(fr);
  const ky = knotY(fr);
  const x = cx + twist * s * 0.012;
  ellipse(
    canvas,
    fr,
    x,
    ky,
    s * 0.042,
    s * 0.03,
    twist * 0.6,
    fill(fr, '#fff6e8'),
    stroke(fr, INK, lw * 0.8),
  );
  canvas.drawCircle(x, ky - s * 0.004, s * 0.012, fill(fr, '#e0473e'));
}

/** The bamboo steamer's rim: fixed to the ground, so the bun squashes and hops inside it. */
function steamerBox(fr: Frame) {
  'worklet';
  const { s, cx } = fr;
  const ground = s * 0.865;
  const restingRy = s * 0.235;
  const half = s * 0.335 * 1.12;
  return {
    top: ground - restingRy * 0.6,
    bottom: ground + s * 0.012,
    left: cx - half,
    right: cx + half,
  };
}

/** The dark inside of the steamer, seen past the bun's sides. */
function drawSteamerBack(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx } = fr;
  const { top, left, right } = steamerBox(fr);
  const rx = (right - left) / 2 - s * 0.01;
  ellipse(canvas, fr, cx, top + s * 0.006, rx, s * 0.026, 0, fill(fr, '#7d5126'));
}

/** The steamer's front wall: woven bamboo slats under a pale lip, over the bun's lower half. */
function drawSteamerFront(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, lw } = fr;
  const { top, bottom, left, right } = steamerBox(fr);
  const corner = s * 0.03;
  const shape = pathBuilder(fr);
  shape.moveTo(left, top);
  shape.lineTo(right, top);
  shape.lineTo(right, bottom - corner);
  shape.quadTo(right, bottom, right - corner, bottom);
  shape.lineTo(left + corner, bottom);
  shape.quadTo(left, bottom, left, bottom - corner);
  const wall = shape.close().build();
  canvas.save();
  canvas.clipPath(wall, ClipOp.Intersect, true);
  fillGradient(canvas, fr, 'bamboo', BAMBOO, BAMBOO_STOPS, top, bottom);
  const slat = stroke(fr, SLAT, lw * 0.42, 0.75);
  for (let x = left + s * 0.03; x < right; x += s * 0.042) {
    canvas.drawLine(x, top + s * 0.03, x, bottom, slat);
  }
  canvas.drawLine(left, top + s * 0.024, right, top + s * 0.024, stroke(fr, SLAT, lw * 0.55));
  canvas.drawLine(left, top + s * 0.01, right, top + s * 0.01, stroke(fr, '#fbe0a8', lw * 0.6));
  canvas.restore();
  canvas.drawPath(wall, stroke(fr, INK, lw * 0.85));
}

/** The bun: the dough with its pleats, shine and outline, then the knot. */
function drawBun(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const bun = bunPath(fr);
  canvas.save();
  canvas.clipPath(bun, ClipOp.Intersect, true);
  fillGradient(canvas, fr, 'dough', DOUGH, DOUGH_STOPS, cy - ry * 1.12, cy + ry);
  drawPleats(canvas, fr);
  const shine = fill(fr, 'rgba(255,255,255,0.75)');
  ellipse(canvas, fr, cx - rx * 0.5, cy - ry * 0.45, s * 0.05, s * 0.022, -0.5, shine);
  canvas.restore();
  canvas.drawPath(bun, stroke(fr, INK, lw));
  drawKnot(canvas, fr);
}

/** Bánh Bao inside the tilted group: the steamer round the bun, its steam, arms, face, snore. */
export function drawBanhBao(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  drawSteamerBack(canvas, fr);
  drawArmsBehind(canvas, fr);
  drawBun(canvas, fr);
  drawSteamerFront(canvas, fr);
  drawSteam(canvas, fr);
  drawArmsInFront(canvas, fr);
  drawFace(canvas, fr);
  drawSnore(canvas, fr);
}
