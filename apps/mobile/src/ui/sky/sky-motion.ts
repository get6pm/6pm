import { useCallback, useEffect } from 'react';
import {
  useReducedMotion,
  useSharedValue,
  type FrameInfo,
  type SharedValue,
} from 'react-native-reanimated';

import { useGatedFrameCallback } from './screen-activity';

/**
 * Milliseconds the sky has been running, ticking on the UI thread every frame while `active` is true
 * (always, when it is not given). Under Reduce Motion it stays at 0, which holds every drift, pulse,
 * twinkle and grain step at its first frame; while paused it keeps the last value.
 */
export function useSkyClock(active: SharedValue<boolean> | null = null): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const time = useSharedValue(0);
  const tick = useCallback(
    (frame: FrameInfo) => {
      'worklet';
      // Adding frame by frame keeps the clock continuous across a pause: the registry restarts
      // its own count from zero each time a callback is started again.
      time.value += frame.timeSincePreviousFrame ?? 0;
    },
    [time],
  );
  useGatedFrameCallback(tick, !reduceMotion, active);
  useEffect(() => {
    if (reduceMotion) time.value = 0;
  }, [reduceMotion, time]);
  return time;
}
