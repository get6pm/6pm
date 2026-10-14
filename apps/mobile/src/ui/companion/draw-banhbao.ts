import { ClipOp, type SkCanvas, type SkPath } from '@shopify/react-native-skia';

import { drawArmsBehind, drawArmsInFront, fillGradient } from './draw-body';
import { drawFace } from './draw-face';
import { INK, ellipse, fill, jitter, pathBuilder, stroke, type Frame } from './draw-kit';
import { jiggle } from './companion-shape';

/**
 * Bánh Bao: a soft steamed bun on its paper square, pleated into a top knot with a red dot. It
 * squashes when it lands and jiggles as it settles, puffs up and settles as it breathes, lets
 * little clouds of steam out of its knot, and twists its pleats when it waves.
 */

const DOUGH = ['#fffbf2', '#fbeedb', '#efd3ae'];
const DOUGH_STOPS = [0, 0.55, 1];
const PLEAT = '#d2a578';
const STEAM_EDGE = '#cfc3b8';
const POINTS = 24;
const PLEATS = 6;
const STEAM_PUFFS = 3;
const STEAM_CYCLE = 2.8;
const BURST_SECONDS = 1.3;

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

/** Where the knot sits: the top of the dome. */
function knotY(fr: Frame): number {
  'worklet';
  return fr.cy - fr.ry * 1.1;
}

/** How far the pleats twist about the knot: a wave winds them, a landing shakes them. */
function twistOf(fr: Frame): number {
  'worklet';
  const { mood, el, since, sinceF } = fr;
  let twist = jiggle(since, 14) * 0.25 + jiggle(sinceF, 12) * 0.35;
  if (mood === 'wave') twist += Math.sin(el * 9) * 0.32;
  if (mood === 'think') twist += 0.18;
  if (mood === 'calm') twist += Math.sin(el * 1.1) * 0.05;
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
    const a = Math.PI * (1.12 + (n / (PLEATS - 1)) * 0.76);
    const fx = cx + Math.cos(a) * rx * 0.62;
    const fy = cy + Math.sin(a) * ry * 0.5;
    const bend = (fx - cx) * 0.35 + twist * s * 0.08;
    const path = pathBuilder(fr);
    path.moveTo(fx, fy);
    path.quadTo((fx + cx) / 2 + bend, (fy + ky) / 2 - ry * 0.12, cx + twist * s * 0.01, ky);
    canvas.drawPath(path.build(), line);
  }
}

/** The knot at the top and its red dot. */
function drawKnot(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, lw } = fr;
  const twist = twistOf(fr);
  const ky = knotY(fr);
  const x = cx + twist * s * 0.01;
  ellipse(
    canvas,
    fr,
    x,
    ky,
    s * 0.04,
    s * 0.03,
    twist * 0.5,
    fill(fr, '#fff6e8'),
    stroke(fr, INK, lw * 0.8),
  );
  canvas.drawCircle(x, ky - s * 0.004, s * 0.012, fill(fr, '#e0473e'));
}

/**
 * Steam from the knot: three small clouds that rise, swell and thin away. They breathe out with
 * the bun; asleep they come slowly.
 */
function drawSteam(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, el, lw, mood } = fr;
  const ky = knotY(fr);
  const pace = mood === 'sleepy' ? 0.5 : 1;
  const breath = 0.6 + 0.4 * Math.sin(el * 2.2);
  const edge = Math.max(0.6, lw * 0.4);
  for (let n = 0; n < STEAM_PUFFS; n++) {
    const p = ((el * pace) / STEAM_CYCLE + n / STEAM_PUFFS) % 1;
    const alpha = Math.min(1, Math.sin(p * Math.PI) * 1.6) * breath;
    const x = cx + (n - 1) * s * 0.05 + Math.sin(p * Math.PI * 2 + n * 2) * s * 0.025;
    const y = ky - s * 0.05 - p * s * 0.2;
    const r = s * (0.022 + 0.03 * p);
    const puff = fill(fr, '#ffffff', alpha);
    const rim = stroke(fr, STEAM_EDGE, edge, alpha);
    canvas.drawCircle(x, y, r, rim);
    canvas.drawCircle(x + r * 0.8, y + r * 0.3, r * 0.7, rim);
    canvas.drawCircle(x, y, r, puff);
    canvas.drawCircle(x + r * 0.8, y + r * 0.3, r * 0.7, puff);
  }
}

/** The bun: its paper square, the dough with its pleats, shine and outline, then the knot. */
function drawBun(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const paperTop = cy + ry * 0.7;
  const paperBottom = cy + ry * 1.04;
  const left = cx - rx * 1.02;
  const right = cx + rx * 1.02;
  const corner = s * 0.014;
  const paper = pathBuilder(fr);
  paper.moveTo(left + corner, paperTop);
  paper.lineTo(right - corner, paperTop);
  paper.quadTo(right, paperTop, right, paperTop + corner);
  paper.lineTo(right, paperBottom - corner);
  paper.quadTo(right, paperBottom, right - corner, paperBottom);
  paper.lineTo(left + corner, paperBottom);
  paper.quadTo(left, paperBottom, left, paperBottom - corner);
  paper.lineTo(left, paperTop + corner);
  paper.quadTo(left, paperTop, left + corner, paperTop);
  const square = paper.close().build();
  canvas.drawPath(square, fill(fr, '#f3e1bd'));
  canvas.drawPath(square, stroke(fr, INK, lw * 0.75));

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

/** A big breath of steam when Bánh Bao is chosen. */
export function drawSteamBurst(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.sinceF < 0 || fr.sinceF >= BURST_SECONDS) return;
  const { s, cx, lw } = fr;
  const p = fr.sinceF / BURST_SECONDS;
  const fade = 1 - p;
  const ky = knotY(fr);
  for (let n = 0; n < 5; n++) {
    const a = -Math.PI / 2 + (n - 2) * 0.45;
    const d = s * (0.06 + 0.22 * p);
    const x = cx + Math.cos(a) * d;
    const y = ky + Math.sin(a) * d;
    const r = s * (0.03 + 0.04 * p);
    canvas.drawCircle(x, y, r, fill(fr, '#ffffff', 0.9 * fade));
    canvas.drawCircle(x, y, r, stroke(fr, STEAM_EDGE, lw * 0.5, fade));
  }
}

/** Bánh Bao inside the tilted group: arms, the bun, its steam, then the face. */
export function drawBanhBao(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  drawArmsBehind(canvas, fr);
  drawBun(canvas, fr);
  drawSteam(canvas, fr);
  drawArmsInFront(canvas, fr);
  drawFace(canvas, fr);
}
