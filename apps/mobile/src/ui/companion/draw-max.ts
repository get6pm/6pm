import { Skia, type SkCanvas } from '@shopify/react-native-skia';

import { INK, degrees, fill, linear, oval, stroke, type Frame } from './draw-kit';

export const GOLD = '#ffd36e';

/** How long the ring of light lasts when the companion becomes Max. */
export const BURST_SECONDS = 1.4;

/** An eight-point star, outlined in ink. */
export function drawStar(
  canvas: SkCanvas,
  fr: Frame,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  'worklet';
  const k = r * 0.32;
  const builder = Skia.PathBuilder.Make();
  builder.moveTo(x, y - r);
  builder.lineTo(x + k, y - k);
  builder.lineTo(x + r, y);
  builder.lineTo(x + k, y + k);
  builder.lineTo(x, y + r);
  builder.lineTo(x - k, y + k);
  builder.lineTo(x - r, y);
  builder.lineTo(x - k, y - k);
  const star = builder.close().build();
  canvas.drawPath(star, fill(color));
  canvas.drawPath(star, stroke(INK, fr.lw * 0.5));
}

/**
 * Half of the Max ring around the body, tilted, with its two moons. The back half is drawn before
 * the body and the front half after the face, so the ring passes behind and in front.
 */
export function drawRing(canvas: SkCanvas, fr: Frame, front: boolean): void {
  'worklet';
  const { s, cx, cy, rx, ry, lw, el } = fr;
  const RX = rx * 1.55;
  const RY = ry * 0.4;
  canvas.save();
  canvas.translate(cx, cy + ry * 0.05);
  canvas.rotate(degrees(-0.28), 0, 0);

  const band = stroke('#000000', lw * 1.35);
  band.setShader(linear(-RX, 0, RX, 0, [GOLD, '#ff9fd0', '#9d8bff'], [0, 0.5, 1]));
  const half = Skia.PathBuilder.Make();
  half.addArc(oval(0, 0, RX, RY), front ? 0 : 180, 180);
  canvas.drawPath(half.build(), band);

  const outline = stroke(INK, lw * 0.6);
  for (let n = 0; n < 2; n++) {
    const a = el * 1.1 + n * Math.PI;
    const sn = Math.sin(a);
    if (sn > 0 !== front) continue;
    const x = Math.cos(a) * RX;
    const y = sn * RY;
    const r = s * (n ? 0.024 : 0.032);
    canvas.drawCircle(x, y, r, fill(n ? '#c9b8ff' : '#fff1c4'));
    canvas.drawCircle(x, y, r, outline);
  }
  canvas.restore();
}

/** The ring of light and the warm flash when the companion becomes Max. */
export function drawBurst(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (!fr.mx || fr.sinceF < 0 || fr.sinceF >= BURST_SECONDS) return;
  const { s, lw } = fr;
  const p = fr.sinceF / BURST_SECONDS;
  const fade = 1 - p;
  canvas.drawCircle(
    s / 2,
    s * 0.57,
    s * (0.16 + p * 0.34),
    stroke(GOLD, lw * 2.2 * fade + 0.5, fade),
  );
  canvas.drawCircle(s / 2, s * 0.55, s * 0.5, fill('#fff0d2', 0.6 * fade * fade * fade));
}
