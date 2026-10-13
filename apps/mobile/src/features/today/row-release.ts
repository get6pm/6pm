import { gestures } from '@6pm/theme';

import { project, rubberband } from '../../ui/motion/physics';

/** What a released swipe on a Today row does. */
export type RowRelease = 'delete' | 'confirm' | 'reveal' | 'home';

/**
 * A row travels a hand's width, not a page: its flick is read at UIScrollView's fast
 * deceleration, so a hard fling commits while an ordinary quick release does not delete.
 */
const ROW_DECELERATION = 0.99;
/** The furthest a row follows the finger before it gives like rubber. */
export const ROW_STOP = { left: -320, right: 220 } as const;
const STOP_GIVE = 60;
/** A row with nothing to confirm only budges to the right. */
const NUDGE_GIVE = 40;

/**
 * Where the row sits for a finger at `raw` (its start plus the drag): one to one inside the
 * stops, rubber past them, and barely at all rightward when there is nothing to confirm.
 */
export function rowOffset(raw: number, reviewable: boolean): number {
  'worklet';
  if (raw > 0 && !reviewable) return rubberband(raw, NUDGE_GIVE);
  if (raw > ROW_STOP.right) return ROW_STOP.right + rubberband(raw - ROW_STOP.right, STOP_GIVE);
  if (raw < ROW_STOP.left) return ROW_STOP.left + rubberband(raw - ROW_STOP.left, STOP_GIVE);
  return raw;
}

/**
 * Decides a release from where the row is and where the flick was taking it: past the delete
 * point it deletes, past the confirm point a caught spend is confirmed, past the reveal point
 * Delete stays open, anything else goes home. A row only commits on the side it was dragged to.
 */
export function rowRelease(at: number, velocityX: number, reviewable: boolean): RowRelease {
  'worklet';
  const to = at + project(velocityX, ROW_DECELERATION);
  if (at < 0 && to < gestures.rowCommitDelete) return 'delete';
  if (at > 0 && reviewable && to > gestures.rowConfirm) return 'confirm';
  if (at < 0 && to < gestures.rowRevealDelete) return 'reveal';
  return 'home';
}
