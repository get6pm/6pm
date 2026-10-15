import { type SkCanvas } from '@shopify/react-native-skia';

import { drawArmsBehind, drawArmsInFront, drawBody, drawFeet, drawGroundShadow } from './draw-body';
import { drawExtras, type SleepFonts } from './draw-extras';
import { drawFace } from './draw-face';
import { degrees, type Frame } from './draw-kit';
import { drawBanhBao } from './draw-banhbao';
import { drawSteamBurst } from './draw-banhbao-steam';
import { drawGiot, drawRainCloud, drawRipples, drawSplash } from './draw-giot';
import { drawHac } from './draw-hac';
import { drawCraneBurst, drawPlane } from './draw-hac-paper';
import { drawBurst, drawRing } from './draw-max';
import { drawNhang, drawSmokeRing } from './draw-nhang';
import { drawRays } from './draw-rays';

/** The sun and its Max form: the back of the ring, feet, rays, arms, body, face, ring's front. */
function drawSun(canvas: SkCanvas, fr: Frame): void {
  'worklet';
  if (fr.mx) drawRing(canvas, fr, false);
  drawFeet(canvas, fr);
  drawRays(canvas, fr);
  drawArmsBehind(canvas, fr);
  drawBody(canvas, fr);
  drawArmsInFront(canvas, fr);
  drawFace(canvas, fr);
  if (fr.mx) drawRing(canvas, fr, true);
}

/**
 * One frame of the companion, back to front: shadow; then, tilted about the feet, the form's own
 * body, hair and face; then whatever floats around it and the moment it became this form.
 */
export function drawCompanion(canvas: SkCanvas, fr: Frame, fonts: SleepFonts): void {
  'worklet';
  drawGroundShadow(canvas, fr);
  if (fr.form === 'giot') drawRipples(canvas, fr);

  canvas.save();
  canvas.rotate(degrees(fr.tilt), fr.cx, fr.cy + fr.ry);
  switch (fr.form) {
    case 'nhang':
      drawNhang(canvas, fr);
      break;
    case 'banhbao':
      drawBanhBao(canvas, fr);
      break;
    case 'giot':
      drawGiot(canvas, fr);
      break;
    case 'hac':
      drawHac(canvas, fr);
      break;
    case 'sun':
    case 'max':
      drawSun(canvas, fr);
  }
  canvas.restore();

  drawExtras(canvas, fr, fonts);
  if (fr.form === 'nhang') drawSmokeRing(canvas, fr);
  if (fr.form === 'banhbao') drawSteamBurst(canvas, fr);
  if (fr.form === 'giot') {
    drawSplash(canvas, fr);
    drawRainCloud(canvas, fr);
  }
  drawPlane(canvas, fr);
  drawCraneBurst(canvas, fr);
  drawBurst(canvas, fr);
}
