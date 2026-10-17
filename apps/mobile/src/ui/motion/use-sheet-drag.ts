import { useCallback, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  ReduceMotion,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedRef,
} from 'react-native-reanimated';
import type Animated from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { curves, gestures } from '@6pm/theme';

import { haptics } from '../haptics';
import { project, release, rubberband } from './physics';

const reduceMotion = ReduceMotion.System;
const ENTER = { duration: 450, easing: Easing.bezier(...curves.enter), reduceMotion };

export interface SheetDrag {
  /** How far the sheet is pulled down from where it rests; `area` while it is off screen. */
  readonly y: ReturnType<typeof useSharedValue<number>>;
  /** From the sheet's resting place to below the screen. */
  readonly travel: ReturnType<typeof useSharedValue<number>>;
  readonly leaving: ReturnType<typeof useSharedValue<boolean>>;
  /** Slides the sheet up from below the screen; `done` runs once it is up. */
  readonly enter: (done?: () => void) => void;
  /** Slides it away, then calls `onDismissed`. */
  readonly dismiss: () => void;
  /** Drags the sheet by whatever it wraps (the grabber and top row). */
  readonly header: ReturnType<typeof Gesture.Pan>;
  /** Where a released drag goes: away past the threshold, else home. */
  readonly settle: (velocity: number) => void;
}

/**
 * A sheet drawn by the app that behaves like the native one: it slides up when asked, its top row
 * drags it, and a release past 120 pt (or 40% of its travel) sends it away at the finger's speed,
 * otherwise it springs home; upward it gives like rubber. Pair with `useScrollDismiss` so the
 * sheet's scroll pulls it down from its top as well.
 */
export function useSheetDrag({
  area,
  onDismissed,
}: {
  readonly area: number;
  readonly onDismissed: () => void;
}): SheetDrag {
  const y = useSharedValue(area);
  const travel = useSharedValue(area);
  const start = useSharedValue(0);
  const leaving = useSharedValue(false);
  const dismissed = useRef(onDismissed);
  dismissed.current = onDismissed;
  const done = useCallback(() => dismissed.current(), []);

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

  const settle = useCallback(
    (velocity: number) => {
      'worklet';
      if (leaving.get()) return;
      const at = y.get();
      const reach = Math.min(gestures.sheetDismiss, travel.get() * 0.4);
      if (at + project(velocity) > reach) {
        scheduleOnRN(haptics.tap);
        leave(velocity);
        return;
      }
      y.set(withSpring(0, { ...release.sheet, velocity, reduceMotion }));
    },
    [leaving, y, travel, leave],
  );

  const header = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onStart((e) => {
          start.set(y.get() - e.translationY);
        })
        .onUpdate((e) => {
          if (leaving.get()) return;
          const next = start.get() + e.translationY;
          y.set(next >= 0 ? next : rubberband(next, travel.get()));
        })
        .onEnd((e) => settle(e.velocityY)),
    [y, start, travel, leaving, settle],
  );

  const enter = useCallback(
    (then?: () => void) => {
      y.set(
        withTiming(0, ENTER, (finished) => {
          if (finished && then) scheduleOnRN(then);
        }),
      );
    },
    [y],
  );
  const dismiss = useCallback(() => leave(0), [leave]);

  return useMemo(
    () => ({ y, travel, leaving, enter, dismiss, header, settle }),
    [y, travel, leaving, enter, dismiss, header, settle],
  );
}

export interface ScrollDismiss {
  readonly ref: AnimatedRef<Animated.ScrollView>;
  readonly onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  /** Goes on a GestureDetector around the ScrollView. */
  readonly gesture: ReturnType<typeof Gesture.Simultaneous>;
}

/**
 * Lets a sheet's scroll pull the sheet down, as iOS sheets do: a downward drag that starts with
 * the content at its top moves the sheet instead, holding the content still; dragged back up past
 * where it began, the content scrolls again. Everything runs on the UI thread.
 */
export function useScrollDismiss(sheet: SheetDrag): ScrollDismiss {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const pulling = useSharedValue(false);
  const from = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      offset.set(e.contentOffset.y);
    },
  });

  const gesture = useMemo(() => {
    const native = Gesture.Native();
    const pan = Gesture.Pan()
      .activeOffsetY([-8, 8])
      .failOffsetX([-14, 14])
      .onUpdate((e) => {
        if (sheet.leaving.get()) return;
        if (!pulling.get()) {
          if (offset.get() > 0.5 || e.translationY <= 0) return;
          pulling.set(true);
          from.set(e.translationY);
        }
        const pulled = e.translationY - from.get();
        if (pulled < 0) {
          // Back above where the pull began: the content scrolls again.
          pulling.set(false);
          sheet.y.set(0);
          return;
        }
        sheet.y.set(pulled);
        scrollTo(ref, 0, 0, false);
      })
      .onEnd((e) => {
        if (!pulling.get()) return;
        pulling.set(false);
        sheet.settle(e.velocityY);
      });
    return Gesture.Simultaneous(pan, native);
  }, [sheet, ref, offset, pulling, from]);

  return { ref, onScroll, gesture };
}
