import { useEffect, useRef } from 'react';
import {
  Easing,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/** The prototype eases every hour-driven change over 1 s with CSS `ease`. */
const TRANSITION = { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/**
 * One switch for a layer that has two prepared states: the numbers with the sun shown, and with
 * it hidden. Both are kept ready on the UI thread, so flipping `flag` (a tab change) tweens to the
 * other set without a React render, and a new hour tweens whichever set is current. The arrays
 * keep a fixed length for a given look. Under Reduce Motion each change is a jump.
 */
export function useSwitchedTween(
  on: readonly number[],
  off: readonly number[],
  flag: SharedValue<boolean>,
  initiallyOn: boolean,
): SharedValue<number[]> {
  const reduceMotion = useReducedMotion();
  const reduced = useSharedValue(reduceMotion);
  const shared = useSharedValue<number[]>([...(initiallyOn ? on : off)]);
  const onValues = useSharedValue<number[]>([...on]);
  const offValues = useSharedValue<number[]>([...off]);
  const onKey = on.join(',');
  const offKey = off.join(',');
  const kept = useRef({ onKey, offKey });

  useEffect(() => {
    reduced.value = reduceMotion;
  }, [reduced, reduceMotion]);

  useEffect(() => {
    // The first render already holds these numbers.
    if (kept.current.onKey !== onKey) onValues.value = numbersOf(onKey);
    if (kept.current.offKey !== offKey) offValues.value = numbersOf(offKey);
    kept.current = { onKey, offKey };
  }, [onKey, offKey, onValues, offValues]);

  useAnimatedReaction(
    () => (flag.value ? onValues.value : offValues.value),
    (target, previous) => {
      // On mount, start from the flag as it is now, not as it was when Home first opened.
      if (previous === null) {
        shared.value = target;
        return;
      }
      shared.value = reduced.value ? target : withTiming(target, TRANSITION);
    },
  );
  return shared;
}

function numbersOf(key: string): number[] {
  return key === '' ? [] : key.split(',').map(Number);
}
