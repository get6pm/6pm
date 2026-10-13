import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { gestures } from '@6pm/theme';

import { haptics } from '../haptics';
import { easeOut } from './curves';
import { project, release, rubberband } from './physics';

const ENTER_MS = 300;
/** A drag shorter than this that springs home is a nudge, not a catch worth a tap. */
const NUDGE = 4;
const reduceMotion = ReduceMotion.System;

/**
 * The finger offset that `rubberband` turns into `shown`: grabbing a panel that is still springing
 * back from above its edge picks it up where it is, without a jump.
 */
export function unband(shown: number, dimension: number, constant = 0.55): number {
  'worklet';
  const r = Math.min(Math.abs(shown), dimension * 0.99);
  return (Math.sign(shown) * (r * dimension)) / (constant * (dimension - r));
}

export interface DragDismissOptions {
  /** Height of the space the panel sits in; it leaves by sliding below it. */
  readonly area: number;
  /** Runs once the panel has left. */
  readonly onDismissed: () => void;
  /** Slide up from below on mount. Off when the panel brings its own entrance. */
  readonly enter?: boolean;
}

/**
 * A panel the finger pulls down to put away. Released, it goes where the flick was heading: past
 * 120 pt (or 40% of its height, if that is less) it leaves at the finger's speed, otherwise it
 * springs home. A grab mid-flight continues from where it is; upward it gives like rubber. The
 * dim behind follows the same value.
 */
export function useDragDismiss({ area, onDismissed, enter = true }: DragDismissOptions) {
  const y = useSharedValue(enter ? area : 0);
  // From the panel's resting place to fully below the area; measured once it lays out.
  const travel = useSharedValue(area);
  const start = useSharedValue(0);
  const leaving = useSharedValue(false);
  // Read through a ref so a new callback each render does not rebuild the gesture.
  const dismissed = useRef(onDismissed);
  dismissed.current = onDismissed;
  const done = useCallback(() => dismissed.current(), []);

  useEffect(() => {
    if (enter) y.set(withTiming(0, { duration: ENTER_MS, easing: easeOut, reduceMotion }));
  }, [enter, y]);

  const leave = useCallback(
    (velocity: number) => {
      'worklet';
      if (leaving.get()) return;
      leaving.set(true);
      y.set(
        withSpring(travel.get(), { ...release.away, velocity, reduceMotion }, (finished) => {
          if (finished) scheduleOnRN(done);
        }),
      );
    },
    [leaving, y, travel, done],
  );

  const drag = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onStart((e) => {
          // Subtract the slop already travelled, so the panel moves from where the eye left it.
          const at = y.get();
          start.set((at < 0 ? unband(at, travel.get()) : at) - e.translationY);
        })
        .onUpdate((e) => {
          if (leaving.get()) return;
          const next = start.get() + e.translationY;
          y.set(next >= 0 ? next : rubberband(next, travel.get()));
        })
        .onEnd((e) => {
          if (leaving.get()) return;
          const at = y.get();
          const reach = Math.min(gestures.sheetDismiss, travel.get() * 0.4);
          if (at + project(e.velocityY) > reach) {
            scheduleOnRN(haptics.tap);
            leave(e.velocityY);
            return;
          }
          y.set(withSpring(0, { ...release.sheet, velocity: e.velocityY, reduceMotion }));
          if (Math.abs(at) > NUDGE) scheduleOnRN(haptics.tap);
        }),
    [y, start, travel, leaving, leave],
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => travel.set(Math.max(1, area - e.nativeEvent.layout.y)),
    [travel, area],
  );
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const backdrop = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, travel.get()], [1, 0], Extrapolation.CLAMP),
  }));
  const dismiss = useCallback(() => leave(0), [leave]);

  return { drag, panel, backdrop, onLayout, dismiss };
}
