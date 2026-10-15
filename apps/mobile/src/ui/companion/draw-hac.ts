import { type SkCanvas, type SkPath } from '@shopify/react-native-skia';

import { drawFace } from './draw-face';
import { INK, fill, pathBuilder, stroke, type Frame } from './draw-kit';
import { GOLD, drawStar } from './draw-max';
import {
  CREASE,
  DARK,
  LIGHT,
  MID,
  PAPER_SHARE,
  drawSheen,
  drawSquare,
  grownOf,
  popOf,
  revealOf,
  smooth,
} from './draw-hac-paper';
import { drawConfetti, drawGlow, drawRibbons } from './draw-hac-flight';

/**
 * Hạc Giấy: a crane folded from red paper, edged and flecked in gold, hovering in a warm glow with
 * gold and pink ribbons trailing from its tail and confetti circling it. Every change of mood is a
 * fold: its wings fold flat along their creases and open again into the new pose, and they flap
 * gently as it breathes. Happy, it flaps hard and climbs; waving, its front wing waves; thinking, it
 * stretches its neck up to watch a paper plane; nodding, it bows its head; asleep it folds down and
 * rests. Chosen, it drops in as a square, folds into a kite and pops up out of it.
 */

const BACK = '#a92a38';
const BACK_DARK = '#8c1f2e';
const FOLD_SECONDS = 0.8;
/** How long the paper square takes to fade once the crane starts to rise from it. */
const SQUARE_FADE = 0.25;

interface Wing {
  readonly tipX: number;
  readonly tipY: number;
  readonly path: SkPath;
}

/**
 * One wing, hinged on the line a → b: a triangle out to its tip, split by its crease into a light
 * and a dark facet. `length` reaches toward `theta`; below zero the wing has folded over and shows
 * its back.
 */
function drawWing(
  canvas: SkCanvas,
  fr: Frame,
  hinge: readonly [number, number, number, number],
  theta: number,
  length: number,
  front: boolean,
): Wing {
  'worklet';
  const { lw } = fr;
  const [ax, ay, bx, by] = hinge;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const tx = mx + Math.sin(theta) * length;
  const ty = my - Math.cos(theta) * length;
  const up = length >= 0;
  const inner = pathBuilder(fr);
  inner.moveTo(ax, ay);
  inner.lineTo(tx, ty);
  inner.lineTo(mx, my);
  canvas.drawPath(inner.close().build(), fill(fr, up ? (front ? LIGHT : MID) : BACK));
  const outer = pathBuilder(fr);
  outer.moveTo(mx, my);
  outer.lineTo(tx, ty);
  outer.lineTo(bx, by);
  canvas.drawPath(outer.close().build(), fill(fr, up ? (front ? MID : DARK) : BACK_DARK));
  canvas.drawLine(mx, my, tx, ty, stroke(fr, CREASE, Math.max(0.6, lw * 0.4)));
  const edge = pathBuilder(fr);
  edge.moveTo(ax, ay);
  edge.lineTo(tx, ty);
  edge.lineTo(bx, by);
  const open = edge.build();
  canvas.drawPath(open, stroke(fr, INK, lw * 0.95));
  canvas.drawPath(open, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
  const whole = pathBuilder(fr);
  whole.moveTo(ax, ay);
  whole.lineTo(tx, ty);
  whole.lineTo(bx, by);
  return { tipX: tx, tipY: ty, path: whole.close().build() };
}

/**
 * The neck and head on the left, or the tail on the right: a long thin point from the body's
 * side, rising `rise` radians. The head ends in a folded beak and a gold crest.
 */
function drawPoint(
  canvas: SkCanvas,
  fr: Frame,
  side: number,
  rise: number,
  reach: number,
  head: boolean,
  bob: number,
): readonly [number, number] {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const bx = cx + side * rx * 0.72;
  const by = cy + ry * 0.4;
  const length = s * (head ? 0.42 : 0.38) * reach;
  const tx = bx + side * Math.cos(rise) * length;
  const ty = by - Math.sin(rise) * length;
  const w = s * 0.05;
  const nx = Math.sin(rise) * w;
  const ny = Math.cos(rise) * w * side;
  const point = pathBuilder(fr);
  point.moveTo(bx - nx, by - ny);
  point.lineTo(tx, ty);
  point.lineTo(bx + nx, by + ny);
  const shape = point.close().build();
  canvas.drawPath(shape, fill(fr, head ? MID : LIGHT));
  canvas.drawPath(shape, stroke(fr, INK, lw * 0.6));
  canvas.drawPath(shape, stroke(fr, GOLD, Math.max(0.5, lw * 0.25)));
  canvas.drawLine(bx, by, tx, ty, stroke(fr, CREASE, Math.max(0.5, lw * 0.32)));
  if (!head || reach <= 0.05) return [tx, ty];
  const hx = tx + side * s * 0.065 * reach;
  const hy = ty + s * (0.045 + bob) * reach;
  const beak = pathBuilder(fr);
  beak.moveTo(tx - side * s * 0.008, ty - s * 0.01);
  beak.lineTo(hx, hy);
  beak.lineTo(tx - side * s * 0.012, ty + s * 0.026 * reach);
  const folded = beak.close().build();
  canvas.drawPath(folded, fill(fr, DARK));
  canvas.drawPath(folded, stroke(fr, INK, lw * 0.75));
  canvas.drawCircle(tx - side * s * 0.004, ty + s * 0.006, s * 0.009, fill(fr, GOLD));
  return [tx, ty];
}

const FLECKS = [
  [-0.55, 0.42],
  [0.62, 0.3],
  [0.3, 0.72],
  [-0.25, 0.8],
  [0.78, 0.12],
];

/** The body: a folded boat of paper in two facets, flecked and edged in gold, creased. */
function drawPaperBody(canvas: SkCanvas, fr: Frame): SkPath {
  'worklet';
  const { s, cx, cy, rx, ry, lw } = fr;
  const top = cy - ry * 0.6;
  const left = cx - rx * 1.05;
  const right = cx + rx * 1.05;
  const side = cy + ry * 0.05;
  const bottom = cy + ry;
  const leftFacet = pathBuilder(fr);
  leftFacet.moveTo(cx, top);
  leftFacet.lineTo(left, side);
  leftFacet.lineTo(cx - rx * 0.3, bottom);
  leftFacet.lineTo(cx, bottom);
  canvas.drawPath(leftFacet.close().build(), fill(fr, LIGHT));
  const rightFacet = pathBuilder(fr);
  rightFacet.moveTo(cx, top);
  rightFacet.lineTo(right, side);
  rightFacet.lineTo(cx + rx * 0.3, bottom);
  rightFacet.lineTo(cx, bottom);
  canvas.drawPath(rightFacet.close().build(), fill(fr, MID));
  const fold = pathBuilder(fr);
  fold.moveTo(left, side);
  fold.lineTo(cx, bottom);
  fold.lineTo(cx - rx * 0.3, bottom);
  canvas.drawPath(fold.close().build(), fill(fr, '#ffffff', 0.14));
  const fleck = fill(fr, GOLD, 0.85);
  for (const [ox = 0, oy = 0] of FLECKS) {
    canvas.drawCircle(cx + ox * rx, cy + oy * ry - ry * 0.2, s * 0.0055, fleck);
  }
  const crease = stroke(fr, CREASE, Math.max(0.6, lw * 0.4));
  canvas.drawLine(cx, top, cx, bottom, crease);
  canvas.drawLine(left, side, cx, bottom, crease);
  canvas.drawLine(right, side, cx, bottom, crease);
  const outline = pathBuilder(fr);
  outline.moveTo(cx, top);
  outline.lineTo(right, side);
  outline.lineTo(cx + rx * 0.3, bottom);
  outline.lineTo(cx - rx * 0.3, bottom);
  outline.lineTo(left, side);
  const out = outline.close().build();
  canvas.drawPath(out, stroke(fr, INK, lw));
  canvas.drawPath(out, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
  return out;
}

/** Hạc Giấy inside the tilted group: the paper it arrives as, then the crane rising out of it. */
export function drawHac(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, el, mood, since, cx, cy, rx, ry } = fr;
  const grown = grownOf(fr);
  const reveal = revealOf(fr);
  if (reveal < 0.7) {
    const shown = 1 - smooth(Math.max(0, Math.min(1, (reveal - PAPER_SHARE) / SQUARE_FADE)));
    canvas.saveLayer(fill(fr, '#ffffff', shown));
    drawSquare(canvas, fr);
    canvas.restore();
  }
  if (grown <= 0) return;

  const breath = Math.sin(el * 2);
  let back = 0.36 + breath * 0.06;
  let wing = -0.22 + breath * 0.06;
  let fold = 1 - 0.08 * (0.5 + 0.5 * breath);
  let neck = 1.05 + Math.sin(el * 1.2) * 0.04;
  let tail = 0.72;
  let bob = 0;
  let lift = s * 0.035 + Math.sin(el * 1.6) * s * 0.015;
  if (mood === 'happy') {
    const flap = Math.sin(el * 7);
    wing = -0.4 - flap * 0.55;
    back = 0.5 + flap * 0.55;
    fold = 1;
    neck = 1.18;
    tail = 0.88;
    lift += Math.abs(Math.sin(el * 3.5)) * s * 0.07;
  }
  if (mood === 'wave') wing = -0.55 + Math.sin(el * 9) * 0.5;
  if (mood === 'sleepy') {
    wing = -1.0;
    back = 1.05;
    fold = 0.6;
    neck = 0.3;
    tail = 0.42;
    bob = 0.03;
    lift = 0;
  }
  if (mood === 'think') {
    neck = 1.32;
    bob = -0.022 + Math.sin(el * 1.7) * 0.006;
    wing = -0.15;
  }
  if (mood === 'nod') {
    neck = 0.8 + Math.sin(el * 2.6) * 0.32;
    bob = Math.max(0, Math.sin(el * 2.6)) * 0.025;
  }
  if (since < FOLD_SECONDS) fold *= Math.cos((since / FOLD_SECONDS) * Math.PI * 2);
  fold *= grown;
  lift *= grown;
  const length = s * 0.36 * fold;
  drawGlow(canvas, fr, cy - ry * 0.4 - lift);

  canvas.save();
  const scale = 0.6 + 0.4 * popOf(fr);
  canvas.translate(cx, cy + ry - lift);
  canvas.scale(scale, scale);
  canvas.translate(-cx, -(cy + ry));
  drawConfetti(canvas, fr, false);
  const backHinge = [cx - rx * 0.05, cy - ry * 0.58, cx + rx * 0.88, cy + ry * 0.02] as const;
  drawWing(canvas, fr, backHinge, back, length, false);
  const [tailX, tailY] = drawPoint(canvas, fr, 1, tail, grown, false, 0);
  drawRibbons(canvas, fr, tailX, tailY);
  drawPoint(canvas, fr, -1, neck, grown, true, bob);
  drawSheen(canvas, fr, drawPaperBody(canvas, fr), 0);
  const frontHinge = [cx - rx * 0.88, cy + ry * 0.02, cx + rx * 0.05, cy - ry * 0.58] as const;
  const front = drawWing(canvas, fr, frontHinge, wing, length, true);
  drawSheen(canvas, fr, front.path, -0.25);
  drawFace(canvas, fr);
  drawConfetti(canvas, fr, true);
  if (mood === 'happy' && Math.sin(el * 7) < -0.8) {
    drawStar(canvas, fr, front.tipX, front.tipY, s * 0.034, GOLD);
  }
  canvas.restore();
}
