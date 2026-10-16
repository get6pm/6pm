import { useCallback, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { gestures } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { project, release, rubberband } from '../../ui/motion/physics';

const reduceMotion = ReduceMotion.System;

/**
 * Swipe right to put Scan away, where it fills the screen rather than sitting in a sheet (the
 * iPhone Duo, whose wide screens would float a sheet as a card). The screen follows the finger;
 * released, it leaves at the flick's speed past the sheet's dismiss distance, else springs back.
 * Leftward it gives like rubber. Off while `enabled` is false (a payment under way).
 */
export function useSwipeBack({
  width,
  enabled,
  onDismissed,
}: {
  readonly width: number;
  readonly enabled: boolean;
  readonly onDismissed: () => void;
}) {
  const x = useSharedValue(0);
  const leaving = useSharedValue(false);
  const dismissed = useRef(onDismissed);
  dismissed.current = onDismissed;
  const done = useCallback(() => dismissed.current(), []);

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-20, 20])
        .failOffsetY([-14, 14])
        .onUpdate((e) => {
          if (leaving.get()) return;
          const next = e.translationX;
          x.set(next >= 0 ? next : rubberband(next, width));
        })
        .onEnd((e) => {
          if (leaving.get()) return;
          if (x.get() + project(e.velocityX) > gestures.sheetDismiss) {
            leaving.set(true);
            scheduleOnRN(haptics.tap);
            x.set(
              withSpring(width, { ...release.away, velocity: e.velocityX, reduceMotion }, (end) => {
                if (end) scheduleOnRN(done);
              }),
            );
            return;
          }
          x.set(withSpring(0, { ...release.sheet, velocity: e.velocityX, reduceMotion }));
        }),
    [enabled, width, x, leaving, done],
  );

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return { swipe, style };
}
