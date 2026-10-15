import type { LookId } from '@6pm/theme';

import type { LookSun } from '../../sun-geometry';

/**
 * Looks whose sun the shared disc cannot draw: Sơn Mài's gold leaf (seams over an off-centre
 * highlight), Bát Tràng's painted rings, Riso Club's flat ink with its misprinted ghost, Paper
 * Diorama's paper disc on its thread.
 */
const OWN_SUN: readonly LookId[] = ['lacquer', 'glaze', 'riso', 'paper'];

export const drawsOwnSun = (look: LookId): boolean => OWN_SUN.includes(look);

/**
 * The sun as the prototype's markup draws it, as boxes: the thread from the top of the screen,
 * the disc (centred on its point), and the ghost over it, multiplied and offset.
 */
export function sunBoxes(sun: LookSun, width: number): Record<string, unknown>[] {
  const left = sun.x * width;
  const r = sun.size / 2;
  const disc = {
    l: `${left - r}px`,
    t: `${sun.y - r}px`,
    w: `${sun.size}px`,
    h: `${sun.size}px`,
    r: '50%',
  };
  const out: Record<string, unknown>[] = [];
  if (sun.threadOp > 0 && sun.threadH > 0) {
    out.push({
      l: `${left}px`,
      t: '0px',
      w: '1px',
      h: `${sun.threadH}px`,
      bg: sun.thread,
      op: sun.threadOp,
    });
  }
  out.push({ ...disc, bg: sun.color, sh: sun.glow, mk: sun.mask, op: sun.opacity });
  if (sun.ghostOp > 0) {
    out.push({
      ...disc,
      l: `${left - r + sun.gx}px`,
      t: `${sun.y - r + sun.gy}px`,
      bg: sun.ghost,
      op: sun.ghostOp,
      bl: 'multiply',
    });
  }
  return out;
}
