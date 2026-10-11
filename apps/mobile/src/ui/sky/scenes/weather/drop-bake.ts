import {
  ClipOp,
  FillType,
  Skia,
  TileMode,
  type SkImage,
  type SkPaint,
  type SkPath,
} from '@shopify/react-native-skia';

/**
 * A drop on the glass, as the prototype paints it: `border-radius: 50% / 58% 58% 42% 42%` (an egg,
 * fuller on top), a `radial-gradient(circle at 38% 30%, …)` bead, an inset highlight along the
 * bottom edge and a faint shadow beneath it.
 */
const TOP_FRACTION = 0.58;
const GRADIENT_AT = { x: 0.38, y: 0.3 } as const;
const BEAD = [
  [1, 1, 1, 0.8],
  [1, 1, 1, 0.1],
  [0, 20 / 255, 30 / 255, 0.14],
];
const BEAD_AT = [0, 0.1, 0.42, 1];
const BEAD_STOPS = [BEAD[0], BEAD[0], BEAD[1], BEAD[2]];
/** CSS blur radius b is a Gaussian of deviation b / 2. */
const HIGHLIGHT = { dy: -1, sigma: 0.5, color: [1, 1, 1, 0.35] };
const SHADOW = { dy: 1, sigma: 0.75, color: [0, 0, 0, 0.18] };
/** Premultiplied interpolation, as CSS gradients blend. */
const PREMULTIPLIED = 1;
/** Room around the drop for the shadow's and highlight's blur and their one-point offsets. */
export const DROP_PADDING = 4;

/** The drop outline at the origin: two half-ellipses meeting at 58% of the height. */
export function dropOutline(w: number, h: number): string {
  const mid = h * TOP_FRACTION;
  return `M0 ${mid}A${w / 2} ${mid} 0 0 1 ${w} ${mid}` + `A${w / 2} ${h - mid} 0 0 1 0 ${mid}Z`;
}

function blurred(color: readonly number[], sigma: number): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Float32Array.from(color));
  paint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Decal, null));
  return paint;
}

/** Everything outside the outline, for the inset highlight (a frame with the drop cut out). */
function frameAround(outline: SkPath, w: number, h: number): SkPath {
  return Skia.PathBuilder.Make()
    .moveTo(-w, -h)
    .lineTo(2 * w, -h)
    .lineTo(2 * w, 2 * h)
    .lineTo(-w, 2 * h)
    .close()
    .addPath(outline)
    .setFillType(FillType.EvenOdd)
    .build();
}

const cache = new Map<string, SkImage | null>();

/**
 * One drop painted once at `scale` pixels per point, with `DROP_PADDING` points around it. The same
 * size is painted once however many drops share it. Returns null when no surface can be made.
 */
export function bakeDrop(w: number, h: number, scale: number): SkImage | null {
  const key = `${w}x${h}@${scale}`;
  const kept = cache.get(key);
  if (kept !== undefined) return kept;
  const outline = Skia.Path.MakeFromSVGString(dropOutline(w, h));
  const surface = outline
    ? Skia.Surface.Make(
        Math.ceil((w + 2 * DROP_PADDING) * scale),
        Math.ceil((h + 2 * DROP_PADDING) * scale),
      )
    : null;
  if (!outline || !surface) {
    cache.set(key, null);
    return null;
  }
  const canvas = surface.getCanvas();
  canvas.scale(scale, scale);
  canvas.translate(DROP_PADDING, DROP_PADDING);

  // Shadow: everything outside the outline, a point down.
  canvas.save();
  canvas.clipPath(outline, ClipOp.Difference, true);
  canvas.translate(0, SHADOW.dy);
  canvas.drawPath(outline, blurred(SHADOW.color, SHADOW.sigma));
  canvas.restore();

  // Bead: `circle` reaches the farthest corner.
  const bead = Skia.Paint();
  bead.setAntiAlias(true);
  bead.setShader(
    Skia.Shader.MakeRadialGradient(
      { x: GRADIENT_AT.x * w, y: GRADIENT_AT.y * h },
      Math.hypot((1 - GRADIENT_AT.x) * w, (1 - GRADIENT_AT.y) * h),
      BEAD_STOPS.map((stop) => Float32Array.from(stop ?? [])),
      BEAD_AT,
      TileMode.Clamp,
      undefined,
      PREMULTIPLIED,
    ),
  );
  canvas.drawPath(outline, bead);

  // Highlight: the blurred frame, kept inside the outline, a point up.
  canvas.save();
  canvas.clipPath(outline, ClipOp.Intersect, true);
  canvas.translate(0, HIGHLIGHT.dy);
  canvas.drawPath(frameAround(outline, w, h), blurred(HIGHLIGHT.color, HIGHLIGHT.sigma));
  canvas.restore();

  surface.flush();
  const image = surface.makeImageSnapshot();
  cache.set(key, image);
  return image;
}
