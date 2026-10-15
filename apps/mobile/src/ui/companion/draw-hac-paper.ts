import { ClipOp, type SkCanvas, type SkPath } from '@shopify/react-native-skia';

import { INK, box, degrees, fill, pathBuilder, stroke, type Frame } from './draw-kit';
import { GOLD } from './draw-max';

/**
 * Hạc Giấy's paper and its arrival: the colours of the red sheet, the square that drops in, spins
 * to a diamond and folds into the kite the crane rises from, the burst of light as it does, and the
 * paper plane it watches while it thinks.
 */

export const LIGHT = '#f26a6f';
export const MID = '#d94450';
export const DARK = '#b52d3d';
export const CREASE = '#f5cf72';
/** How long the arrival takes, and the share of it spent as a folding square. */
const REVEAL_SECONDS = 1.7;
export const PAPER_SHARE = 0.45;
const BURST_SECONDS = 1.4;

function clamp01(v: number): number {
  'worklet';
  return Math.max(0, Math.min(1, v));
}

export function smooth(v: number): number {
  'worklet';
  return v * v * (3 - 2 * v);
}

/** How far through its arrival the crane is, 0 → 1; 1 long after it. */
export function revealOf(fr: Frame): number {
  'worklet';
  return fr.sinceF >= 0 && fr.sinceF < REVEAL_SECONDS ? fr.sinceF / REVEAL_SECONDS : 1;
}

/** How far the crane has grown out of the folded paper, easing out. */
export function grownOf(fr: Frame): number {
  'worklet';
  const p = revealOf(fr);
  if (p >= 1) return 1;
  if (p < PAPER_SHARE) return 0;
  const u = (p - PAPER_SHARE) / (1 - PAPER_SHARE);
  return 1 - Math.pow(1 - u, 3);
}

/** The crane's scale as it pops up from the paper: past full size, then settling back. */
export function popOf(fr: Frame): number {
  'worklet';
  const p = revealOf(fr);
  if (p >= 1) return 1;
  if (p < PAPER_SHARE) return 0;
  const u = clamp01((p - PAPER_SHARE) / 0.4) - 1;
  const overshoot = 2.2;
  return 1 + (overshoot + 1) * u * u * u + overshoot * u * u;
}

/** The kite the diamond folds into: its side corners folded in to the centre crease by `k`. */
function drawKite(canvas: SkCanvas, fr: Frame, x: number, y: number, size: number, k: number) {
  'worklet';
  const { lw } = fr;
  const w = size * (1 - 0.62 * k);
  const h = size * (1 + 0.15 * k);
  const outline = pathBuilder(fr);
  outline.moveTo(x, y - h);
  outline.lineTo(x + w, y);
  outline.lineTo(x, y + h);
  outline.lineTo(x - w, y);
  const kite = outline.close().build();
  canvas.drawPath(kite, fill(fr, LIGHT));
  const right = pathBuilder(fr);
  right.moveTo(x, y - h);
  right.lineTo(x + w, y);
  right.lineTo(x, y + h);
  canvas.drawPath(right.close().build(), fill(fr, MID));
  for (let side = -1; side <= 1; side += 2) {
    const tip = x + side * (size - k * size * 1.15);
    const flap = pathBuilder(fr);
    flap.moveTo(x, y - h);
    flap.lineTo(tip, y);
    flap.lineTo(x, y + h * 0.72);
    const folded = flap.close().build();
    canvas.drawPath(folded, fill(fr, side < 0 ? '#ff8a8e' : DARK, 0.95));
    canvas.drawPath(folded, stroke(fr, INK, lw * 0.6));
  }
  canvas.drawLine(x, y - h, x, y + h, stroke(fr, CREASE, lw * 0.4));
  canvas.drawPath(kite, stroke(fr, INK, lw));
  canvas.drawPath(kite, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
}

/**
 * The sheet it arrives as: it drops in spinning, lands with a small bounce, turns to a diamond as
 * its creases show, then folds its sides in toward the centre.
 */
export function drawSquare(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, ry, lw } = fr;
  const t = clamp01(revealOf(fr) / PAPER_SHARE);
  const size = s * 0.2;
  const drop = clamp01(t / 0.3);
  const bounce = drop >= 1 ? Math.sin(clamp01((t - 0.3) / 0.12) * Math.PI) * -s * 0.02 : 0;
  const y = cy - ry * 0.15 - Math.pow(1 - drop, 2) * s * 0.32 + bounce;
  const spin = (1 - drop) * 0.9 + smooth(clamp01((t - 0.32) / 0.28)) * (Math.PI / 4);
  const k = smooth(clamp01((t - 0.62) / 0.38));
  if (k > 0) {
    // Turned all the way, the square is a diamond: draw it upright and fold it.
    drawKite(canvas, fr, cx, y, size, k);
    return;
  }
  canvas.save();
  canvas.rotate(degrees(spin), cx, y);
  const h = size / Math.SQRT2;
  const outline = pathBuilder(fr);
  outline.moveTo(cx - h, y - h);
  outline.lineTo(cx + h, y - h);
  outline.lineTo(cx + h, y + h);
  outline.lineTo(cx - h, y + h);
  const sheet = outline.close().build();
  canvas.drawPath(sheet, fill(fr, LIGHT));
  const crease = stroke(fr, CREASE, lw * 0.4, smooth(clamp01((t - 0.4) / 0.2)));
  canvas.drawLine(cx - h, y - h, cx + h, y + h, crease);
  canvas.drawLine(cx + h, y - h, cx - h, y + h, crease);
  canvas.drawPath(sheet, stroke(fr, INK, lw));
  canvas.drawPath(sheet, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
  canvas.restore();
}

/** The paper plane a thinking crane watches, looping round above it with a dotted trail. */
export function drawPlane(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.form !== 'hac' || fr.mood !== 'think') return;
  const { s, cx, lw, el } = fr;
  const a = el * 1.7;
  const x = cx + Math.cos(a) * s * 0.34;
  const y = s * 0.17 + Math.sin(a) * s * 0.06;
  const dir = -Math.sin(a) >= 0 ? 1 : -1;
  const L = s * 0.05;
  const shape = pathBuilder(fr);
  shape.moveTo(x + dir * L, y);
  shape.lineTo(x - dir * L * 0.8, y - L * 0.55);
  shape.lineTo(x - dir * L * 0.35, y);
  shape.lineTo(x - dir * L * 0.8, y + L * 0.35);
  const plane = shape.close().build();
  canvas.drawPath(plane, fill(fr, '#fffaf2'));
  canvas.drawPath(plane, stroke(fr, INK, lw * 0.55));
  canvas.drawLine(x + dir * L, y, x - dir * L * 0.35, y, stroke(fr, '#d8cfc4', lw * 0.4));
  for (let k = 1; k <= 3; k++) {
    const tx = x - dir * (L + k * s * 0.025);
    const ty = y + Math.sin(a + k) * s * 0.004;
    canvas.drawCircle(tx, ty, s * 0.004, fill(fr, '#ffffff', 0.6 - k * 0.15));
  }
}

/** The ring of light, warm flash and spinning confetti as the crane rises out of the paper. */
export function drawCraneBurst(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.form !== 'hac') return;
  const t = fr.sinceF - REVEAL_SECONDS * PAPER_SHARE;
  if (t < 0 || t >= BURST_SECONDS) return;
  const { s, cx, lw } = fr;
  const p = t / BURST_SECONDS;
  const fade = 1 - p;
  const cy = s * 0.5;
  canvas.drawCircle(cx, cy, s * (0.14 + p * 0.36), stroke(fr, GOLD, lw * 2.2 * fade + 0.5, fade));
  canvas.drawCircle(cx, cy, s * (0.2 + 0.25 * p), fill(fr, '#fff0d2', 0.35 * fade * fade * fade));
  for (let n = 0; n < 8; n++) {
    const a = (n / 8) * Math.PI * 2 + 0.3;
    const d = s * (0.1 + p * 0.38);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const r = s * 0.02 * fade;
    canvas.save();
    canvas.rotate(degrees(p * 6 + n), x, y);
    const shape = pathBuilder(fr);
    shape.moveTo(x, y - r);
    shape.lineTo(x + r * 0.6, y);
    shape.lineTo(x, y + r);
    shape.lineTo(x - r * 0.6, y);
    canvas.drawPath(shape.close().build(), fill(fr, n % 2 ? '#ff9fd0' : GOLD, fade));
    canvas.restore();
  }
}

/** A light sweeping across a facet of paper every 3.8 seconds, clipped to `path`. */
export function drawSheen(canvas: SkCanvas, fr: Frame, path: SkPath, delay: number): void {
  'worklet';
  const { s, cx, cy, el } = fr;
  const p = ((el + delay) % 3.8) / 3.8;
  if (p < 0 || p > 0.4) return;
  const u = p / 0.4;
  const x = cx - s * 0.45 + u * s * 0.9;
  const strength = Math.sin(u * Math.PI);
  canvas.save();
  canvas.clipPath(path, ClipOp.Intersect, true);
  canvas.rotate(degrees(0.45), x, cy);
  canvas.drawRect(
    box(fr, x - s * 0.035, cy - s * 0.6, s * 0.07, s * 1.2),
    fill(fr, '#fff4dc', 0.55 * strength),
  );
  canvas.drawRect(
    box(fr, x + s * 0.05, cy - s * 0.6, s * 0.018, s * 1.2),
    fill(fr, '#fff4dc', 0.4 * strength),
  );
  canvas.restore();
}
