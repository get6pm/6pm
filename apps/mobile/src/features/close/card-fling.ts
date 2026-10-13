import { gestures } from '@6pm/theme';

import { project } from '../../ui/motion/physics';

/** Where a released top card goes: kept (right), edit (left), not mine (down), or home. */
export type CardFling = 'kept' | 'edit' | 'notMine' | null;

/**
 * Which way a released card was flung. The finger's speed is projected onto where it was dragged,
 * and only the axis it mostly travelled counts, so a mostly-downward drag that drifts right is
 * "not mine", never "keep". Upward goes nowhere.
 */
export function cardFling(
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  threshold: number = gestures.cardFling,
): CardFling {
  'worklet';
  const px = x + project(velocityX);
  const py = y + project(velocityY);
  if (Math.abs(px) >= Math.abs(py)) {
    if (px > threshold) return 'kept';
    if (px < -threshold) return 'edit';
    return null;
  }
  return py > threshold ? 'notMine' : null;
}
