import { useEffect } from 'react';
import {
  Easing,
  FadeIn,
  Keyframe,
  ReduceMotion,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { curves } from '@6pm/theme';

/** Onboarding's keyframes, as the prototype times them. */
export const ease = {
  enter: Easing.bezier(...curves.enter),
  /** The companion's and the first number's pop: `cubic-bezier(.2,1.2,.4,1)`. */
  popIn: Easing.bezier(0.2, 1.2, 0.4, 1),
  /** Cards dealt onto the deck: `cubic-bezier(.2,.9,.25,1.1)`. */
  card: Easing.bezier(0.2, 0.9, 0.25, 1.1),
  /** Cards flung off the deck: `cubic-bezier(.4,0,.6,1)`. */
  fling: Easing.bezier(0.4, 0, 0.6, 1),
  /** The speech bubble: `cubic-bezier(.2,1.3,.4,1)`. */
  bubble: Easing.bezier(0.2, 1.3, 0.4, 1),
  css: Easing.bezier(0.25, 0.1, 0.25, 1),
  cssIn: Easing.bezier(0.42, 0, 1, 1),
  cssInOut: Easing.bezier(0.42, 0, 0.58, 1),
};

/** Under Reduce Motion every entrance becomes a 200 ms fade. */
const reducedFade = FadeIn.duration(200).reduceMotion(ReduceMotion.Never);

/** A step sliding in from the side it comes from (`inR` / `inL`), 450 ms. */
export function stepEntering(direction: 1 | -1, reduceMotion: boolean) {
  if (reduceMotion) return reducedFade;
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateX: 44 * direction }] },
    100: { opacity: 1, transform: [{ translateX: 0 }], easing: ease.enter },
  })
    .duration(450)
    .reduceMotion(ReduceMotion.Never);
}

/** `rise`: up 16 pt and in, after `delay` ms. */
export function riseEntering(duration: number, delay: number, reduceMotion: boolean) {
  if (reduceMotion) return reducedFade;
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 16 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }], easing: ease.css },
  })
    .duration(duration)
    .delay(delay)
    .reduceMotion(ReduceMotion.Never);
}

/** `pop`: from 0.4 to 1.12 and back to 1 (badges, chips, the companion). */
export function popEntering(
  duration: number,
  delay: number,
  reduceMotion: boolean,
  easing: typeof ease.css = ease.css,
) {
  if (reduceMotion) return reducedFade;
  return new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.4 }] },
    70: { opacity: 1, transform: [{ scale: 1.12 }], easing },
    100: { opacity: 1, transform: [{ scale: 1 }], easing },
  })
    .duration(duration)
    .delay(delay)
    .reduceMotion(ReduceMotion.Never);
}

/** `fade`, after `delay` ms. */
export function fadeEntering(duration: number, delay: number, reduceMotion: boolean) {
  return FadeIn.duration(reduceMotion ? 200 : duration)
    .delay(reduceMotion ? 0 : delay)
    .reduceMotion(ReduceMotion.Never);
}

/**
 * A value that runs 0 → 1 once when the component mounts, for keyframes Reanimated's entering
 * animations cannot express (a card flung off with a tilt, a bar growing from the left).
 */
export function useMountProgress(
  duration: number,
  easing: typeof ease.css,
  delay = 0,
): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      reduceMotion ? 0 : delay,
      withTiming(1, { duration: reduceMotion ? 200 : duration, easing }),
    );
  }, [progress, duration, easing, delay, reduceMotion]);
  return progress;
}

/**
 * A looping 0 → 1 clock for the little demos (scan line, mail sliding, tap rings). Held at
 * `stillAt` under Reduce Motion: nothing loops.
 */
export function useLoop(period: number, delay = 0, stillAt = 0): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const phase = useSharedValue(stillAt);
  useEffect(() => {
    if (reduceMotion) {
      phase.value = stillAt;
      return;
    }
    phase.value = 0;
    phase.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false),
    );
  }, [phase, period, delay, stillAt, reduceMotion]);
  return phase;
}
