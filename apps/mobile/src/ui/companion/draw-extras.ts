import { type SkCanvas, type SkFont } from '@shopify/react-native-skia';

import { INK, fill, pathBuilder, stroke, type Frame } from './draw-kit';
import { GOLD } from './draw-max';

/** The two italic serif faces the sleeping "z"s are set in. */
export interface SleepFonts {
  readonly large: SkFont;
  readonly small: SkFont;
}

const SPARKLES = [
  [0.14, 0.2, 0],
  [0.86, 0.28, 1.3],
  [0.8, 0.08, 2.4],
];

const THOUGHTS = [
  [0.78, 0.3, 0.025],
  [0.86, 0.18, 0.04],
];

/** Four-point sparkles that swell and vanish around a happy or Max companion. */
function drawSparkles(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, lw, el } = fr;
  const gold = fill(fr, GOLD);
  const outline = stroke(fr, INK, lw * 0.6);
  for (const [px = 0, py = 0, ph = 0] of SPARKLES) {
    const r = s * 0.045 * Math.max(0, Math.sin(el * 3 + ph));
    if (r < 0.5) continue;
    const x = px * s;
    const y = py * s;
    const k = r * 0.35;
    const tallShape = pathBuilder(fr);
    tallShape.moveTo(x, y - r);
    tallShape.lineTo(x + k, y);
    tallShape.lineTo(x, y + r);
    tallShape.lineTo(x - k, y);
    const tall = tallShape.close().build();
    const wideShape = pathBuilder(fr);
    wideShape.moveTo(x - r, y);
    wideShape.lineTo(x, y + k);
    wideShape.lineTo(x + r, y);
    wideShape.lineTo(x, y - k);
    const wide = wideShape.close().build();
    canvas.drawPath(tall, gold);
    canvas.drawPath(tall, outline);
    canvas.drawPath(wide, gold);
    canvas.drawPath(wide, outline);
  }
}

/** Two "z"s drifting up and fading, every two seconds. */
function drawSleep(canvas: SkCanvas, fr: Frame, fonts: SleepFonts): void {
  'worklet';
  const { s, el } = fr;
  const ph = (el * 0.5) % 1;
  const paint = fill(fr, '#c9b8ff', Math.sin(ph * Math.PI));
  canvas.drawText('z', s * (0.74 + ph * 0.08), s * (0.3 - ph * 0.14), paint, fonts.large);
  canvas.drawText('z', s * (0.86 + ph * 0.05), s * (0.16 - ph * 0.1), paint, fonts.small);
}

/** Two thought bubbles bobbing beside a thinking companion. */
function drawThoughts(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, lw, el } = fr;
  const cloud = fill(fr, 'rgba(255,255,255,0.85)');
  const outline = stroke(fr, INK, lw * 0.6);
  for (let n = 0; n < THOUGHTS.length; n++) {
    const [px = 0, py = 0, r = 0] = THOUGHTS[n] ?? [];
    const y = py * s - Math.sin(el * 2 + n) * s * 0.01;
    canvas.drawCircle(px * s, y, r * s, cloud);
    canvas.drawCircle(px * s, y, r * s, outline);
  }
}

/** What floats around the body: sparkles, sleep or thoughts. */
export function drawExtras(canvas: SkCanvas, fr: Frame, fonts: SleepFonts): void {
  'worklet';
  if (fr.mood === 'happy' || fr.mx) drawSparkles(canvas, fr);
  // Nhang sleeps and thinks in its own smoke.
  if (fr.form === 'nhang') return;
  if (fr.mood === 'sleepy') drawSleep(canvas, fr, fonts);
  if (fr.mood === 'think') drawThoughts(canvas, fr);
}
