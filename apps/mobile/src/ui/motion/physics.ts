/**
 * Where a released finger was heading: the distance it would still travel if it kept slowing at
 * UIScrollView's normal rate. A quick short flick projects far and commits; a slow long drag
 * doesn't. `velocity` in points per second, as Gesture Handler reports it.
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * How far an element follows a finger dragged `overshoot` points past its edge: less and less
 * the further it goes, so a boundary gives like rubber instead of stopping dead.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Springs for motion a finger hands over: each takes the release `velocity` so nothing seams
 * between the drag and the settle.
 */
export const release = {
  /** Back home after a drag that did not commit. */
  home: { duration: 400, dampingRatio: 0.8 },
  /** A sheet or drawer settling open. */
  sheet: { duration: 300, dampingRatio: 0.8 },
  /** Off the screen after a commit: no overshoot past the edge. */
  away: { duration: 300, dampingRatio: 1, overshootClamping: true },
} as const;
