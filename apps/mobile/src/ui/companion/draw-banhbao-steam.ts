import { type SkCanvas } from '@shopify/react-native-skia';

import { fill, pathBuilder, stroke, type Frame } from './draw-kit';

/** What rises from Bánh Bao's knot: steam, a heart, a thought, and the snore of a nap. */

const STEAM_EDGE = '#cfc3b8';
const STEAM_PUFFS = 3;
const STEAM_CYCLE = 2.8;
const BURST_SECONDS = 1.3;

/** Where the knot sits: the top of the dome. */
export function knotY(fr: Frame): number {
  'worklet';
  return fr.cy - fr.ry * 1.1;
}

/** One small cloud: a round puff with a smaller one tucked beside it, edged in warm grey. */
function drawPuff(canvas: SkCanvas, fr: Frame, x: number, y: number, r: number, alpha: number) {
  'worklet';
  const rim = stroke(fr, STEAM_EDGE, Math.max(0.6, fr.lw * 0.4), alpha);
  const white = fill(fr, '#ffffff', alpha);
  canvas.drawCircle(x, y, r, rim);
  canvas.drawCircle(x + r * 0.8, y + r * 0.3, r * 0.7, rim);
  canvas.drawCircle(x, y, r, white);
  canvas.drawCircle(x + r * 0.8, y + r * 0.3, r * 0.7, white);
}

/** Thinking: three dots of steam appear one by one over the knot, then start again. */
function drawThinking(canvas: SkCanvas, fr: Frame, ky: number) {
  'worklet';
  const { s, cx, el, lw } = fr;
  const phase = (el * 1.4) % 4;
  for (let i = 0; i < 3; i++) {
    if (phase < i + 0.6) continue;
    const x = cx + (i - 1) * s * 0.055;
    const y = ky - s * 0.1 - Math.sin(el * 3 + i) * s * 0.006;
    canvas.drawCircle(x, y, s * 0.018, fill(fr, '#ffffff', 0.95));
    canvas.drawCircle(x, y, s * 0.018, stroke(fr, STEAM_EDGE, lw * 0.45));
  }
}

/** Happy: a pink heart of steam rises from the knot and fades. */
function drawHeart(canvas: SkCanvas, fr: Frame, ky: number) {
  'worklet';
  const { s, cx, el, lw } = fr;
  const p = (el % 1.6) / 1.6;
  const r = s * 0.035 * (0.7 + 0.5 * p);
  const hx = cx + Math.sin(p * 5) * s * 0.012;
  const hy = ky - s * 0.07 - p * s * 0.16;
  const alpha = Math.min(1, p * 4) * (1 - p);
  const shape = pathBuilder(fr);
  shape.moveTo(hx, hy + r);
  shape.cubicTo(hx - r * 1.2, hy + r * 0.2, hx - r * 0.8, hy - r * 0.85, hx, hy - r * 0.25);
  shape.cubicTo(hx + r * 0.8, hy - r * 0.85, hx + r * 1.2, hy + r * 0.2, hx, hy + r);
  const heart = shape.close().build();
  canvas.drawPath(heart, fill(fr, '#ffe3ea', alpha));
  canvas.drawPath(heart, stroke(fr, '#f0a3b5', lw * 0.5, alpha));
}

/**
 * Steam from the knot: three small clouds that rise, swell and thin away. They breathe out with
 * the bun; asleep they come slowly. Thinking it puffs a row of dots instead, happy a heart.
 */
export function drawSteam(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  const { s, cx, el, mood } = fr;
  const ky = knotY(fr);
  if (mood === 'think') {
    drawThinking(canvas, fr, ky);
    return;
  }
  if (mood === 'happy') {
    drawHeart(canvas, fr, ky);
    return;
  }
  const pace = mood === 'sleepy' ? 0.5 : 1;
  const breath = 0.6 + 0.4 * Math.sin(el * 2.2);
  for (let n = 0; n < STEAM_PUFFS; n++) {
    const p = ((el * pace) / STEAM_CYCLE + n / STEAM_PUFFS) % 1;
    const alpha = Math.min(1, Math.sin(p * Math.PI) * 1.6) * breath;
    const x = cx + (n - 1) * s * 0.05 + Math.sin(p * Math.PI * 2 + n * 2) * s * 0.025;
    const y = ky - s * 0.05 - p * s * 0.2;
    drawPuff(canvas, fr, x, y, s * (0.022 + 0.03 * p), alpha);
  }
}

/** Asleep, a sleep bubble swells from beside the mouth every few seconds and pops. */
export function drawSnore(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.mood !== 'sleepy') return;
  const { s, cx, cy, ry, lw, el } = fr;
  const p = (el % 3.2) / 3.2;
  if (p > 0.92) return;
  const r = s * (0.008 + 0.05 * p);
  const x = cx + s * 0.035 + r * 0.6;
  const y = cy + ry * 0.12 + s * 0.012 - r * 0.2;
  canvas.drawCircle(x, y, r, fill(fr, '#eaf6ff', 0.45));
  canvas.drawCircle(x, y, r, stroke(fr, '#8ec3e6', lw * 0.5, 0.9));
  canvas.drawCircle(x - r * 0.35, y - r * 0.35, r * 0.18, fill(fr, '#ffffff', 0.9));
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
