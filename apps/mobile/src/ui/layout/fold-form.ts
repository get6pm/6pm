import type { FoldRect, FoldSnapshot } from '../../../modules/fold';

/** The gap the design keeps between the two pages when the screen lies flat and reports no fold. */
export const FLAT_GUTTER = 40;

/** Narrowest page the two-page layouts are drawn for: Today's hero and October's grid. */
const MIN_PAGE = 360;

export interface Page {
  readonly x: number;
  readonly width: number;
}

export interface Half {
  readonly y: number;
  readonly height: number;
}

/**
 * How 6pm lays itself out for the way the phone is held:
 * - `phone`: one column, as on every other iPhone (and the Duo opened upright and flat).
 * - `rail`: the Duo's outer screen; the island runs down the right edge, so the bars live in a
 *   rail there and the content keeps the rest.
 * - `spread`: the Duo opened sideways; two pages either side of the fold, the rail on the right.
 *   `book` when it is part way open, held like a book.
 * - `stand`: part way open with the fold across, standing on a table: the top half to read, the
 *   bottom half to touch.
 */
export type FoldForm =
  | { readonly kind: 'phone' }
  | { readonly kind: 'rail'; readonly rail: number }
  | {
      readonly kind: 'spread';
      readonly left: Page;
      readonly right: Page;
      readonly rail: number;
      readonly book: boolean;
    }
  | { readonly kind: 'stand'; readonly top: Half; readonly bottom: Half };

/** The width of anything covering the window's right edge (the island, the camera), else 0. */
function rightEdge(occlusions: readonly FoldRect[], width: number): number {
  let rail = 0;
  for (const o of occlusions) {
    if (o.x + o.width >= width - 1) rail = Math.max(rail, width - o.x);
  }
  return Math.round(rail);
}

export function foldForm(
  snapshot: FoldSnapshot,
  window: { readonly width: number; readonly height: number },
): FoldForm {
  const { hinge, divisions, occlusions } = snapshot;
  const { width, height } = window;
  if (hinge === 'unknown') return { kind: 'phone' };

  if (hinge === 'closed') {
    const rail = rightEdge(occlusions, width);
    return rail > 0 ? { kind: 'rail', rail } : { kind: 'phone' };
  }

  const division = divisions[0];
  const across = division && division.width > division.height;

  if (hinge === 'partial' && division && across) {
    const bottomY = division.y + division.height;
    return {
      kind: 'stand',
      top: { y: 0, height: division.y },
      bottom: { y: bottomY, height: height - bottomY },
    };
  }

  // Sideways, with room for two pages: split at the fold, or at the middle when it lies flat.
  const gutterX = division && !across ? division.x : (width - FLAT_GUTTER) / 2;
  const gutterWidth = division && !across ? division.width : FLAT_GUTTER;
  const rightX = gutterX + gutterWidth;
  if (width > height && gutterX >= MIN_PAGE && width - rightX >= MIN_PAGE) {
    return {
      kind: 'spread',
      left: { x: 0, width: gutterX },
      right: { x: rightX, width: width - rightX },
      rail: rightEdge(occlusions, width),
      book: hinge === 'partial',
    };
  }
  return { kind: 'phone' };
}
