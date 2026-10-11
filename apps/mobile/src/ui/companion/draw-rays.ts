import { type SkCanvas } from '@shopify/react-native-skia';

import { INK, jitter, stroke, type Frame } from './draw-kit';
import { GOLD, drawStar } from './draw-max';

const BASE_RAYS = [-0.62, 0, 0.62];
const MAX_RAYS = [-1.12, -0.56, 0, 0.56, 1.12];

/**
 * The crown of rays over the head: three, or five tipped with stars in the Max form. They swing a
 * little, grow and pulse when happy, and droop when sleepy. Plain (serious) has none.
 */
export function drawRays(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.plain) return;
  const { s, cx, cy, rx, ry, lw, el, mood } = fr;
  const pulse = mood === 'happy' ? 1.25 + Math.sin(el * 8) * 0.12 : mood === 'sleepy' ? 0.7 : 1;
  const rays = fr.mx ? MAX_RAYS : BASE_RAYS;
  const line = stroke(fr, INK, lw * 1.05);
  for (let n = 0; n < rays.length; n++) {
    const a = -Math.PI / 2 + (rays[n] ?? 0) + Math.sin(el * 1.8 + n) * 0.05;
    const mid = n === (rays.length - 1) / 2;
    const r0 = 1.12;
    const r1 = 1.12 + (mid ? 0.38 : 0.28) * pulse;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    canvas.drawLine(
      cx + cos * rx * r0 + jitter(fr, 70 + n, 0.004),
      cy + sin * ry * r0,
      cx + cos * rx * r1 + jitter(fr, 75 + n, 0.006),
      cy + sin * ry * r1 + jitter(fr, 78 + n, 0.006),
      line,
    );
    if (fr.mx) {
      const r = s * (mid ? 0.05 : 0.036) * (0.85 + Math.sin(el * 4 + n) * 0.15);
      drawStar(canvas, fr, cx + cos * rx * (r1 + 0.1), cy + sin * ry * (r1 + 0.1), r, GOLD);
    }
  }
}
