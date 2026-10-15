import { type SkCanvas } from '@shopify/react-native-skia';

import {
  INK,
  degrees,
  fill,
  fillShader,
  pathBuilder,
  stroke,
  unitRadial,
  type Frame,
} from './draw-kit';
import { GOLD } from './draw-max';

/** What flies with the crane: the glow it hovers in, its tail ribbons and its circling confetti. */

const GLOW = ['rgba(255,211,110,0.42)', 'rgba(255,159,208,0.16)', 'rgba(255,159,208,0)'];
const GLOW_STOPS = [0, 0.55, 1];
const CONFETTI = [GOLD, '#ff9fd0', '#c9b8ff'];

const RIBBONS = [
  [0, 0.2],
  [1.6, 0.16],
];
const RIBBON_COLORS = [GOLD, '#ff9fd0'];

/** Two ribbons, gold and pink, rippling back from the tail's tip: quicker when happy. */
export function drawRibbons(canvas: SkCanvas, fr: Frame, x: number, y: number): void {
  'worklet';
  const { s, el, lw, mood } = fr;
  const amp = mood === 'happy' ? 0.035 : mood === 'sleepy' ? 0.008 : 0.02;
  const speed = mood === 'happy' ? 7 : 3.2;
  for (let r = 0; r < RIBBONS.length; r++) {
    const [phase = 0, length = 0] = RIBBONS[r] ?? [];
    const path = pathBuilder(fr);
    path.moveTo(x, y);
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      const wave = Math.sin(t * 5.5 - el * speed + phase) * s * amp * t;
      path.lineTo(x + t * s * length, y + t * s * 0.07 + wave);
    }
    canvas.drawPath(path.build(), stroke(fr, RIBBON_COLORS[r] ?? GOLD, lw * 0.75));
  }
}

/** Three diamonds of confetti circling over the crane; the half of the orbit behind or in front. */
export function drawConfetti(canvas: SkCanvas, fr: Frame, front: boolean): void {
  'worklet';
  const { s, cx, cy, ry, lw, el, mood } = fr;
  if (mood === 'sleepy') return;
  const spread = mood === 'happy' ? 0.44 + Math.sin(el * 3.5) * 0.03 : 0.38;
  for (let k = 0; k < 3; k++) {
    const a = el * 0.9 + k * 2.094;
    const sn = Math.sin(a);
    if (sn > 0 !== front) continue;
    const x = cx + Math.cos(a) * s * spread;
    const y = cy - ry * 1.55 + sn * s * 0.08;
    const r = s * 0.036 * (0.8 + 0.2 * sn);
    canvas.save();
    canvas.rotate(degrees(el * 2 + k), x, y);
    const shape = pathBuilder(fr);
    shape.moveTo(x, y - r);
    shape.lineTo(x + r * 0.62, y);
    shape.lineTo(x, y + r);
    shape.lineTo(x - r * 0.62, y);
    const diamond = shape.close().build();
    canvas.drawPath(diamond, fill(fr, CONFETTI[k] ?? GOLD));
    canvas.drawLine(x, y - r, x, y + r, stroke(fr, '#ffffff', lw * 0.35, 0.8));
    canvas.drawPath(diamond, stroke(fr, INK, lw * 0.38));
    canvas.restore();
  }
}

/** The warm glow it hovers in, dimmer while it sleeps. */
export function drawGlow(canvas: SkCanvas, fr: Frame, y: number): void {
  'worklet';
  const { s, cx, el, mood } = fr;
  const glow = mood === 'sleepy' ? 0.35 : 0.75 + 0.25 * Math.sin(el * 1.6);
  const paint = fillShader(fr, unitRadial(fr, 'hac-glow', GLOW, GLOW_STOPS));
  paint.setAlphaf(glow);
  canvas.save();
  canvas.translate(cx, y);
  canvas.scale(s * 0.42, s * 0.42);
  canvas.drawCircle(0, 0, 1, paint);
  canvas.restore();
}
