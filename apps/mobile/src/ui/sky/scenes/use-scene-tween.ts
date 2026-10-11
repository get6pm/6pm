import { useEffect } from 'react';
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/** The prototype eases every hour-driven change over 1 s with CSS `ease`, as the base sky does. */
const TRANSITION = { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/**
 * A scene's hour-driven numbers (opacities, colour channels, positions) as one shared array that
 * tweens to each new hour over 1 s on the UI thread, and jumps under Reduce Motion. Keep the
 * array's length fixed for a given look.
 */
export function useSceneTween(values: readonly number[]): SharedValue<number[]> {
  const reduceMotion = useReducedMotion();
  const shared = useSharedValue<number[]>([...values]);
  const key = values.join(',');
  useEffect(() => {
    const next = key === '' ? [] : key.split(',').map(Number);
    shared.value = reduceMotion ? next : withTiming(next, TRANSITION);
  }, [key, reduceMotion, shared]);
  return shared;
}
