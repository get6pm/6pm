import { Skia, TileMode, type SkImage } from '@shopify/react-native-skia';

import type { Rgba } from '../../css-values';

/** The fog is a soft haze, so a fraction of the screen's resolution shows no difference. */
const SCALE = 0.5;

export interface BakedBank {
  readonly image: SkImage;
  /** Rows of blur tail kept above and below the bank, in points. */
  readonly padding: number;
}

/**
 * One fog bank, blurred once: a wide radial haze (`rgba` at its centre, clear by 70%) squeezed to
 * the bank's height, with the Gaussian blur applied on the CPU into a small image. Drawing that
 * image moved sideways every frame costs a textured quad instead of a blur pass, and looks the
 * same. Returns null when no surface can be made, so the caller can blur live instead.
 */
export function bakeFogBank(
  fog: Rgba,
  boxWidth: number,
  height: number,
  centerX: number,
  fadeOut: number,
  sigma: number,
): BakedBank | null {
  const padding = Math.ceil(sigma * 3);
  const surface = Skia.Surface.Make(
    Math.ceil(boxWidth * SCALE),
    Math.ceil((height + 2 * padding) * SCALE),
  );
  if (!surface) return null;
  const canvas = surface.getCanvas();
  canvas.scale(SCALE, SCALE);
  canvas.translate(0, padding);

  const centre = { x: centerX * boxWidth, y: height / 2 };
  const radius = boxWidth / 2;
  const squeeze = height / 2 / radius;
  const clear = Float32Array.of(fog[0], fog[1], fog[2], 0);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setShader(
    Skia.Shader.MakeRadialGradient(
      centre,
      radius,
      [Float32Array.from(fog), clear, clear],
      [0, fadeOut, 1],
      TileMode.Clamp,
      Skia.Matrix([1, 0, 0, 0, squeeze, centre.y * (1 - squeeze), 0, 0, 1]),
    ),
  );
  paint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Decal, null));
  canvas.drawRect({ x: 0, y: 0, width: boxWidth, height }, paint);
  surface.flush();
  return { image: surface.makeImageSnapshot(), padding };
}
