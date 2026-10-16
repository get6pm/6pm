import { BlurStyle, PaintStyle, Skia, StrokeCap, type SkImage } from '@shopify/react-native-skia';

import type { RainLayerSpec } from './rain-geometry';
import { strokeGroups } from './rain-geometry';
import type { RainTile } from './weather-atm';

/** One baked tile: its image and the size in pixels it was painted at. */
export interface BakedRain {
  readonly image: SkImage;
  readonly pixels: readonly [number, number];
}

const cache = new Map<string, BakedRain | null>();

/**
 * One cell of a rain layer painted once at `scale` pixels per point, at the layer's tile size on
 * screen, each stroke group at its ink (the layer's own alpha is applied when it is drawn). The
 * neighbouring cells are painted too, so strokes running over an edge, and the soft layer's blur,
 * wrap round and the tile repeats without a seam. Returns null when no surface can be made.
 */
export function bakeRainTile(
  tile: RainTile,
  spec: RainLayerSpec,
  scale: number,
): BakedRain | null {
  const [tw, th] = spec.tile;
  const key = `${JSON.stringify(tile)}|${tw}x${th}|${spec.blur}@${scale}`;
  const kept = cache.get(key);
  if (kept !== undefined) return kept;
  const pixels: [number, number] = [Math.max(1, Math.round(tw * scale)), Math.max(1, Math.round(th * scale))];
  const surface = Skia.Surface.Make(pixels[0], pixels[1]);
  if (!surface) {
    cache.set(key, null);
    return null;
  }
  const canvas = surface.getCanvas();
  // Tile units to pixels: the strokes and their weights squeeze with the tile, as the layer's
  // `background-size` squeezes the SVG.
  const scaleX = pixels[0] / tile.width;
  const scaleY = pixels[1] / tile.height;
  canvas.scale(scaleX, scaleY);
  const [r, g, b] = tile.color;
  for (const group of strokeGroups(tile)) {
    const path = Skia.Path.Make();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const s of group.strokes) {
          path.moveTo(dx * tile.width + s.x, dy * tile.height + s.y);
          path.lineTo(dx * tile.width + s.x, dy * tile.height + s.y + s.length);
        }
      }
    }
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(group.width);
    paint.setStrokeCap(StrokeCap.Round);
    paint.setColor(Float32Array.of(r, g, b, group.opacity));
    if (spec.blur > 0) {
      // `filter: blur()` on the layer: the deviation in points on screen, through the squeeze.
      const sigma = (spec.blur * scale) / Math.sqrt(scaleX * scaleY);
      paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, sigma, true));
    }
    canvas.drawPath(path, paint);
  }
  surface.flush();
  const baked = { image: surface.makeImageSnapshot(), pixels };
  cache.set(key, baked);
  return baked;
}
