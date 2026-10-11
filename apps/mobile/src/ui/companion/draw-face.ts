import { ClipOp, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import {
  INK,
  degrees,
  ellipse,
  fill,
  jitter,
  oval,
  pathBuilder,
  stroke,
  type Frame,
} from './draw-kit';

const MOUTH = '#6e2236';

/** Calm, thinking and waving faces blink for a beat every 4.1 seconds. */
function blinking(fr: Frame): boolean {
  'worklet';
  const { mood, el } = fr;
  return (mood === 'calm' || mood === 'think' || mood === 'wave') && el % 4.1 > 3.96;
}

function arc(
  canvas: SkCanvas,
  fr: Frame,
  x: number,
  y: number,
  r: number,
  from: number,
  to: number,
  paint: SkPaint,
): void {
  'worklet';
  canvas.drawArc(oval(fr, x, y, r, r), degrees(from), degrees(to - from), false, paint);
}

function drawCheeks(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.plain) return;
  const { s, cx, cy, ry } = fr;
  const blush = fill(fr, 'rgba(255,92,120,0.42)');
  ellipse(canvas, fr, cx - s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026, 0, blush);
  ellipse(canvas, fr, cx + s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026, 0, blush);
}

function drawEyes(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, ry, lw, mood } = fr;
  const ey = cy - ry * 0.2;
  const closed = mood === 'nod' || mood === 'sleepy' || blinking(fr);
  const lookX = mood === 'think' ? s * 0.012 : 0;
  const lookY = mood === 'think' ? -s * 0.014 : 0;
  const line = stroke(fr, INK, lw);
  const ink = fill(fr, INK);
  const white = fill(fr, '#ffffff');
  const sides = [-1, 1];
  for (let n = 0; n < sides.length; n++) {
    const x = cx + (sides[n] ?? 1) * s * 0.1 + jitter(fr, 95 + n, 0.002);
    if (mood === 'happy') {
      arc(canvas, fr, x, ey + s * 0.022, s * 0.038, Math.PI * 1.12, Math.PI * 1.88, line);
    } else if (closed) {
      arc(canvas, fr, x, ey - s * 0.012, s * 0.034, Math.PI * 0.15, Math.PI * 0.85, line);
    } else if (fr.plain) {
      canvas.drawCircle(x, ey, s * 0.026, ink);
    } else {
      ellipse(canvas, fr, x, ey, s * 0.037, s * 0.047, 0, ink);
      canvas.drawCircle(x + s * 0.011 + lookX, ey - s * 0.015 + lookY, s * 0.014, white);
      canvas.drawCircle(x - s * 0.01 + lookX, ey + s * 0.016 + lookY, s * 0.006, white);
    }
  }
}

function drawMouth(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, cy, ry, lw, mood } = fr;
  const my = cy + ry * 0.1;
  const line = stroke(fr, INK, lw);
  if (mood === 'happy') {
    const open = pathBuilder(fr);
    open.moveTo(cx - s * 0.05, my - s * 0.005);
    open.quadTo(cx, my + s * 0.085, cx + s * 0.05, my - s * 0.005);
    open.close();
    const mouth = open.build();
    canvas.drawPath(mouth, fill(fr, MOUTH));
    canvas.drawPath(mouth, line);
    canvas.save();
    canvas.clipPath(mouth, ClipOp.Intersect, true);
    ellipse(canvas, fr, cx, my + s * 0.055, s * 0.03, s * 0.02, 0, fill(fr, '#ff7f96'));
    canvas.restore();
  } else if (fr.plain) {
    canvas.drawLine(cx - s * 0.03, my + s * 0.01, cx + s * 0.03, my + s * 0.01, line);
  } else if (mood === 'sleepy' || mood === 'think') {
    const x = cx + (mood === 'think' ? s * 0.02 : 0);
    ellipse(canvas, fr, x, my + s * 0.012, s * 0.014, s * 0.018, 0, fill(fr, MOUTH));
  } else {
    const smile = pathBuilder(fr);
    smile.moveTo(cx - s * 0.035, my);
    smile.quadTo(cx, my + s * 0.04, cx + s * 0.035, my);
    canvas.drawPath(smile.build(), line);
  }
}

/** Cheeks, eyes and mouth for the mood. */
export function drawFace(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  drawCheeks(canvas, fr);
  drawEyes(canvas, fr);
  drawMouth(canvas, fr);
}
