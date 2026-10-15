import { Skia, type SkPath } from '@shopify/react-native-skia';

import type { Radii } from './box-model';

/** A conic weight that draws a quarter ellipse exactly. */
const QUARTER = Math.SQRT1_2;

/**
 * A rounded box from (x, y), each corner its own ellipse (CSS `border-radius` with `/`), drawn
 * with conics so a 50% radius is a true circle or ellipse.
 */
export function roundedBox(x: number, y: number, w: number, h: number, radii: Radii): SkPath {
  const [[tlx, tly], [trx, try_], [brx, bry], [blx, bly]] = radii;
  const p = Skia.Path.Make();
  p.moveTo(x + tlx, y);
  p.lineTo(x + w - trx, y);
  if (trx > 0 && try_ > 0) p.conicTo(x + w, y, x + w, y + try_, QUARTER);
  p.lineTo(x + w, y + h - bry);
  if (brx > 0 && bry > 0) p.conicTo(x + w, y + h, x + w - brx, y + h, QUARTER);
  p.lineTo(x + blx, y + h);
  if (blx > 0 && bly > 0) p.conicTo(x, y + h, x, y + h - bly, QUARTER);
  p.lineTo(x, y + tly);
  if (tlx > 0 && tly > 0) p.conicTo(x, y, x + tlx, y, QUARTER);
  p.close();
  return p;
}

/** Radii grown (or shrunk, for a negative `by`) as CSS grows a shadow's or border's corners. */
export function grownRadii(radii: Radii, by: number): Radii {
  const g = ([rx, ry]: readonly [number, number]): [number, number] =>
    rx > 0 || ry > 0 ? [Math.max(0, rx + by), Math.max(0, ry + by)] : [0, 0];
  return [g(radii[0]), g(radii[1]), g(radii[2]), g(radii[3])];
}
