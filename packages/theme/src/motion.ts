/**
 * The prototype's motion, as numbers Reanimated takes. Bezier control points feed
 * `Easing.bezier(...)`; durations are milliseconds. Springs are tuned to land like the beziers
 * (same settle time, same overshoot) when a gesture hands over its velocity.
 */
export const curves = {
  /** The house curve: a confident move with a small overshoot (cards, sheets, chips). */
  house: [0.2, 0.9, 0.25, 1.12],
  /** Entrances: screens, list items, hero cards. */
  enter: [0.2, 0.9, 0.2, 1],
  /** Wheel pickers snapping to a row. */
  snap: [0.2, 0.9, 0.25, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const durations = {
  tap: 120,
  sheet: 420,
  screen: 380,
  snap: 380,
  toast: 3000,
  undo: 4500,
  /** Odometer: each digit column rolls for 1000 ms plus 80 ms per position. */
  odometerBase: 1000,
  odometerStep: 80,
  stamp: 520,
} as const;

/** Reanimated `withSpring` configs. */
export const springs = {
  /** Sheets and cards following a release. */
  settle: { damping: 22, stiffness: 240, mass: 1 },
  /** Small things that pop: badges, check marks, the month dot. */
  pop: { damping: 12, stiffness: 320, mass: 0.8 },
  /** The tab pager settling on a page. */
  pager: { damping: 26, stiffness: 260, mass: 1 },
} as const;

/** Gesture thresholds from the prototype, in points. */
export const gestures = {
  cardFling: 90,
  rowConfirm: 90,
  rowRevealDelete: -48,
  rowCommitDelete: -150,
  rowDeleteWidth: 96,
  sheetDismiss: 120,
  tabSwipe: 70,
  fabLongPressMs: 480,
  /** Tab bar shrinks after this much scroll. */
  barCondenseAfter: 80,
} as const;
