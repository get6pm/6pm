import { type SkCanvas } from '@shopify/react-native-skia';

import { drawArm, drawBody, drawFeet, drawGroundShadow } from './draw-body';
import { drawExtras, type SleepFonts } from './draw-extras';
import { drawFace } from './draw-face';
import { degrees, type Frame } from './draw-kit';
import { drawBurst, drawRing } from './draw-max';
import { drawRays } from './draw-rays';

/**
 * One frame of the companion, back to front: shadow; then, tilted about the feet, the back of the
 * Max ring, feet, rays, resting arms, body, raised arms, face and the front of the ring; then
 * whatever floats around it and the Max burst.
 */
export function drawCompanion(canvas: SkCanvas, fr: Frame, fonts: SleepFonts): void {
  'worklet';
  const armsUp = fr.mood === 'happy';
  const waving = fr.mood === 'wave';

  drawGroundShadow(canvas, fr);

  canvas.save();
  canvas.rotate(degrees(fr.tilt), fr.cx, fr.cy + fr.ry);
  if (fr.mx) drawRing(canvas, fr, false);
  drawFeet(canvas, fr);
  drawRays(canvas, fr);
  if (!armsUp && !waving) {
    drawArm(canvas, fr, -1, false);
    drawArm(canvas, fr, 1, false);
  }
  drawBody(canvas, fr);
  if (armsUp) {
    drawArm(canvas, fr, -1, true);
    drawArm(canvas, fr, 1, true);
  }
  if (waving) {
    drawArm(canvas, fr, -1, false);
    drawArm(canvas, fr, 1, true, true);
  }
  drawFace(canvas, fr);
  if (fr.mx) drawRing(canvas, fr, true);
  canvas.restore();

  drawExtras(canvas, fr, fonts);
  drawBurst(canvas, fr);
}
