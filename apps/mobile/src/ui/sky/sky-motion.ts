import { useCallback, useEffect } from 'react';
import {
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type FrameInfo,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Milliseconds since the sky appeared, ticking on the UI thread every frame. Under Reduce Motion it
 * stays at 0, which holds every drift, pulse, twinkle and grain step at its first frame.
 */
export function useSkyClock(): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const time = useSharedValue(0);
  const tick = useCallback(
    (frame: FrameInfo) => {
      'worklet';
      time.value = frame.timeSinceFirstFrame;
    },
    [time],
  );
  useFrameCallback(tick, !reduceMotion);
  useEffect(() => {
    if (reduceMotion) time.value = 0;
  }, [reduceMotion, time]);
  return time;
}
