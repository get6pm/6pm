import { type SkCanvas } from '@shopify/react-native-skia';

import { drawFace } from './draw-face';
import { INK, degrees, fill, pathBuilder, stroke, type Frame } from './draw-kit';
import { GOLD, drawStar } from './draw-max';

/**
 * Hạc Giấy: a crane folded from red paper with gold creases. Every change of mood is a fold: its
 * wings fold flat along their creases and open again into the new pose, and they flap gently as it
 * breathes. Happy, it opens into a full spread crane and folds back; chosen, it unfolds out of a
 * flat square.
 */

const LIGHT = '#f26a6f';
const MID = '#d94450';
const DARK = '#b52d3d';
const BACK = '#a92a38';
const BACK_DARK = '#8c1f2e';
const CREASE = '#f5cf72';
const FOLD_SECONDS = 0.8;
const REVEAL_SECONDS = 1.6;
const SQUARE_SHARE = 0.35;
const HAPPY_CYCLE = 3.2;

/** How far it has opened into the full spread crane, while happy. */
function openness(fr: Frame): number {
  'worklet';
  if (fr.mood !== 'happy') return 0;
  return 0.5 - 0.5 * Math.cos(((fr.el % HAPPY_CYCLE) / HAPPY_CYCLE) * Math.PI * 2);
}

/** How far it has unfolded out of its square, 0 → 1, when it has just been chosen. */
function grownOf(fr: Frame): number {
  'worklet';
  if (fr.sinceF < 0 || fr.sinceF >= REVEAL_SECONDS) return 1;
  const p = fr.sinceF / REVEAL_SECONDS;
  if (p < SQUARE_SHARE) return 0;
  const u = (p - SQUARE_SHARE) / (1 - SQUARE_SHARE);
  return 1 - (1 - u) * (1 - u) * (1 - u);
}

/**
 * One wing, on `side`: a triangle hinged on the body's upper edge, split by its crease into a
 * light and a dark facet. `fold` scales it toward the hinge; below zero it shows its back.
 */
function drawWing(
  canvas: SkCanvas,
  fr: Frame,
  side: number,
  angle: number,
  reach: number,
  fold: number,
) {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const ax = cx + side * rx * 0.04;
  const ay = cy - ry * 0.9;
  const bx = cx + side * rx * 0.62;
  const by = cy - ry * 0.36;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const length = s * 0.33 * reach * fold;
  const tx = mx + side * Math.sin(angle) * length;
  const ty = my - Math.cos(angle) * length;
  const front = fold >= 0;
  const inner = pathBuilder(fr);
  inner.moveTo(ax, ay);
  inner.lineTo(tx, ty);
  inner.lineTo(mx, my);
  canvas.drawPath(inner.close().build(), fill(fr, front ? LIGHT : BACK));
  const outer = pathBuilder(fr);
  outer.moveTo(mx, my);
  outer.lineTo(tx, ty);
  outer.lineTo(bx, by);
  canvas.drawPath(outer.close().build(), fill(fr, front ? MID : BACK_DARK));
  canvas.drawLine(mx, my, tx, ty, stroke(fr, CREASE, Math.max(0.6, lw * 0.4)));
  const edge = pathBuilder(fr);
  edge.moveTo(ax, ay);
  edge.lineTo(tx, ty);
  edge.lineTo(bx, by);
  canvas.drawPath(edge.build(), stroke(fr, INK, lw * 0.85));
  if (fr.mood === 'happy' && openness(fr) > 0.8) {
    drawStar(canvas, fr, tx, ty, s * 0.03 * (openness(fr) - 0.8) * 5, GOLD);
  }
}

/** The neck and folded head on the left, or the tail on the right: a long thin point. */
function drawPoint(
  canvas: SkCanvas,
  fr: Frame,
  side: number,
  rise: number,
  reach: number,
  head: boolean,
) {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const bx = cx + side * rx * 0.86;
  const by = cy - ry * 0.02;
  const length = s * (head ? 0.27 : 0.26) * reach;
  const tx = bx + side * Math.cos(rise) * length;
  const ty = by - Math.sin(rise) * length;
  const w = s * 0.042;
  const nx = Math.sin(rise) * w;
  const ny = Math.cos(rise) * w * side;
  const point = pathBuilder(fr);
  point.moveTo(bx - nx, by - ny);
  point.lineTo(tx, ty);
  point.lineTo(bx + nx, by + ny);
  const shape = point.close().build();
  canvas.drawPath(shape, fill(fr, head ? MID : LIGHT));
  canvas.drawPath(shape, stroke(fr, INK, lw * 0.7));
  if (!head || reach <= 0.05) return;
  const beak = pathBuilder(fr);
  beak.moveTo(tx, ty);
  beak.lineTo(tx - s * 0.075 * reach, ty + s * 0.045 * reach);
  beak.lineTo(tx + s * 0.012, ty + s * 0.04 * reach);
  const folded = beak.close().build();
  canvas.drawPath(folded, fill(fr, DARK));
  canvas.drawPath(folded, stroke(fr, INK, lw * 0.75));
}

/** The body: a folded boat of paper in two facets, creased in gold. */
function drawPaperBody(canvas: SkCanvas, fr: Frame) {
  'worklet';
  const { cx, cy, rx, ry, lw } = fr;
  const top = cy - ry * 0.95;
  const side = cy + ry * 0.02;
  const bottom = cy + ry;
  const left = pathBuilder(fr);
  left.moveTo(cx, top);
  left.lineTo(cx - rx, side);
  left.lineTo(cx - rx * 0.28, bottom);
  left.lineTo(cx, bottom);
  canvas.drawPath(left.close().build(), fill(fr, LIGHT));
  const right = pathBuilder(fr);
  right.moveTo(cx, top);
  right.lineTo(cx + rx, side);
  right.lineTo(cx + rx * 0.28, bottom);
  right.lineTo(cx, bottom);
  canvas.drawPath(right.close().build(), fill(fr, MID));
  const crease = stroke(fr, CREASE, Math.max(0.6, lw * 0.4));
  canvas.drawLine(cx, top, cx, bottom, crease);
  canvas.drawLine(cx - rx, side, cx, bottom, crease);
  canvas.drawLine(cx + rx, side, cx, bottom, crease);
  const outline = pathBuilder(fr);
  outline.moveTo(cx, top);
  outline.lineTo(cx + rx, side);
  outline.lineTo(cx + rx * 0.28, bottom);
  outline.lineTo(cx - rx * 0.28, bottom);
  outline.lineTo(cx - rx, side);
  canvas.drawPath(outline.close().build(), stroke(fr, INK, lw));
}

/** The flat square it unfolds from when chosen, turning into a diamond. */
function drawSquare(canvas: SkCanvas, fr: Frame) {
  'worklet';
  const { s, cx, cy, ry, lw } = fr;
  const u = fr.sinceF / (REVEAL_SECONDS * SQUARE_SHARE);
  const h = s * 0.2 * (0.6 + 0.4 * Math.min(1, u));
  const y = cy - ry * 0.1;
  canvas.save();
  canvas.rotate(degrees(Math.min(1, u) * (Math.PI / 4)), cx, y);
  const square = pathBuilder(fr);
  square.moveTo(cx - h, y - h);
  square.lineTo(cx + h, y - h);
  square.lineTo(cx + h, y + h);
  square.lineTo(cx - h, y + h);
  const paper = square.close().build();
  canvas.drawPath(paper, fill(fr, LIGHT));
  canvas.drawLine(cx - h, y - h, cx + h, y + h, stroke(fr, CREASE, lw * 0.4));
  canvas.drawLine(cx + h, y - h, cx - h, y + h, stroke(fr, CREASE, lw * 0.4));
  canvas.drawPath(paper, stroke(fr, INK, lw));
  canvas.restore();
}

/** Hạc Giấy inside the tilted group: wings, neck and tail behind; the body and face over them. */
export function drawHac(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { el, mood, since } = fr;
  const grown = grownOf(fr);
  if (grown <= 0) {
    drawSquare(canvas, fr);
    return;
  }
  const open = openness(fr);
  let wing = 0.55 + Math.sin(el * 2) * 0.07 + open * 0.45;
  let fold = 1 - 0.1 * (0.5 + 0.5 * Math.sin(el * 2));
  let neck = 1.0 + Math.sin(el * 1.2) * 0.04 + open * 0.15;
  let tail = 0.9 + open * 0.15;
  if (mood === 'sleepy') {
    wing = 0.75;
    fold = 0.55;
    neck = 0.3;
    tail = 0.6;
  }
  if (mood === 'think') neck = 1.3;
  if (mood === 'nod') neck = 1.0 + Math.sin(el * 2.6) * 0.2;
  if (since < FOLD_SECONDS) fold *= Math.cos((since / FOLD_SECONDS) * Math.PI * 2);
  fold *= grown;
  const reach = (1 + open * 0.25) * grown;
  const waving = mood === 'wave' ? 0.85 + Math.sin(el * 9) * 0.4 : wing;

  canvas.save();
  const scale = 0.55 + 0.45 * grown;
  canvas.translate(fr.cx, fr.cy + fr.ry);
  canvas.scale(scale, scale);
  canvas.translate(-fr.cx, -(fr.cy + fr.ry));
  drawWing(canvas, fr, -1, wing, reach, fold);
  drawWing(canvas, fr, 1, waving, reach, fold);
  drawPoint(canvas, fr, 1, tail, grown, false);
  drawPoint(canvas, fr, -1, neck, grown, true);
  drawPaperBody(canvas, fr);
  drawFace(canvas, fr);
  canvas.restore();
}
