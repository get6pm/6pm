import { useCallback, useEffect } from 'react';
import {
  useReducedMotion,
  useSharedValue,
  type FrameInfo,
  type SharedValue,
} from 'react-native-reanimated';

import { useGatedFrameCallback } from './screen-activity';

/**
 * Milliseconds the sky has been running, ticking on the UI thread while `active` is true (always,
 * when it is not given). It moves on in steps of `stepMs` rather than every display frame: the
 * drifts, pulses and twinkles are slow enough that 30 steps a second look the same as 120, and
 * every layer they move is worked out and drawn again only on a step (scrolling still moves the
 * sky every frame). Under Reduce Motion it stays at 0, which holds every drift, pulse, twinkle and
 * grain step at its first frame; while paused it keeps the last value.
 */
export function useSkyClock(
  active: SharedValue<boolean> | null = null,
  stepMs = 0,
): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const time = useSharedValue(0);
  const pending = useSharedValue(0);
  const step = useSharedValue(stepMs);
  useEffect(() => {
    step.value = stepMs;
  }, [step, stepMs]);
  const tick = useCallback(
    (frame: FrameInfo) => {
      'worklet';
      // Adding frame by frame keeps the clock continuous across a pause: the registry restarts
      // its own count from zero each time a callback is started again.
      const waited = pending.value + (frame.timeSincePreviousFrame ?? 0);
      // A millisecond of slack so a 60 Hz frame that lands just short still counts.
      if (waited < step.value - 1) {
        pending.value = waited;
        return;
      }
      pending.value = 0;
      time.value += waited;
    },
    [time, pending, step],
  );
  useGatedFrameCallback(tick, !reduceMotion, active);
  useEffect(() => {
    if (reduceMotion) time.value = 0;
  }, [reduceMotion, time]);
  return time;
}
