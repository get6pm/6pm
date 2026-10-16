import { Skia, type SkPath } from '@shopify/react-native-skia';

import type { Radii } from './box-model';

/**
 * A rounded box from (x, y), each corner its own ellipse (CSS `border-radius` with `/`), so a 50%
 * radius is a true circle or ellipse. Built as a rounded rect rather than drawn corner by corner,
 * so the GPU draws it analytically instead of tessellating its outline again every frame.
 */
export function roundedBox(x: number, y: number, w: number, h: number, radii: Radii): SkPath {
  const [[tlx, tly], [trx, try_], [brx, bry], [blx, bly]] = radii;
  const p = Skia.Path.Make();
  p.addRRect({
    rect: Skia.XYWHRect(x, y, w, h),
    topLeft: { x: tlx, y: tly },
    topRight: { x: trx, y: try_ },
    bottomRight: { x: brx, y: bry },
    bottomLeft: { x: blx, y: bly },
  });
  return p;
}

/** Radii grown (or shrunk, for a negative `by`) as CSS grows a shadow's or border's corners. */
export function grownRadii(radii: Radii, by: number): Radii {
  const g = ([rx, ry]: readonly [number, number]): [number, number] =>
    rx > 0 || ry > 0 ? [Math.max(0, rx + by), Math.max(0, ry + by)] : [0, 0];
  return [g(radii[0]), g(radii[1]), g(radii[2]), g(radii[3])];
}
