import { PathOp, Skia, type SkPath } from '@shopify/react-native-skia';

import type { PaperLayer } from './paper-model';

/** Points past a layer's outline that its blurred shadow still reaches (about 4σ of 7). */
const REACH = 30;

/**
 * The silhouette a layer's `drop-shadow` is cast from: the union of its pieces (so overlapping
 * hills shade once, not twice), trimmed to the band where the shadow can show. Below the ground's
 * top edge the layer itself is opaque and hides it, so the trim saves the blur from working on a
 * 1400 pt tall ground. Built once per geometry.
 */
export function shadowSilhouette(layer: PaperLayer, width: number): SkPath | null {
  let union: SkPath | null = null;
  for (const item of layer.items) {
    const piece = Skia.Path.MakeFromSVGString(item.path);
    if (!piece) continue;
    union = union ? Skia.Path.MakeFromOp(union, piece, PathOp.Union) : piece;
  }
  const ground = layer.items.at(-1);
  if (!union || !ground) return null;
  const top = Math.min(...layer.items.map((i) => i.t)) - REACH;
  const bottom = ground.t + REACH;
  const band = Skia.Path.MakeFromSVGString(
    `M${-REACH} ${top}L${width + REACH} ${top}L${width + REACH} ${bottom}L${-REACH} ${bottom}Z`,
  );
  return band ? Skia.Path.MakeFromOp(union, band, PathOp.Intersect) : union;
}
