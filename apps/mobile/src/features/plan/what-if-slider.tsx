import { useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves } from '@6pm/theme';

import { useTheme } from '../../ui/theme/theme';
import type { PlanColours } from './plan-colours';
import { WHAT_IF_STEP } from './plan-view';

const settle = Easing.bezier(...curves.house);
const SETTLE_MS = 260;
const THUMB = 16;
const TRACK = 8;
const HIT = 32;

/**
 * The what-if range: Future you from 0 to `max` in 250k steps. The thumb follows the finger on the
 * UI thread and ticks at every step; each new step goes to JS once (`onStep`, so the daily number
 * can show the real change), and letting go settles on the step and commits it (`onCommit`).
 */
export function WhatIfSlider({
  value,
  max,
  colours,
  label,
  onStep,
  onCommit,
}: {
  readonly value: number;
  readonly max: number;
  readonly colours: PlanColours;
  readonly label: string;
  readonly onStep: (value: number) => void;
  readonly onCommit: (value: number) => void;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const width = useSharedValue(0);
  const pos = useSharedValue(max > 0 ? value / max : 0);
  const step = useSharedValue(Math.round(value / WHAT_IF_STEP));
  const dragging = useSharedValue(false);
  const steps = Math.max(1, Math.round(max / WHAT_IF_STEP));

  useEffect(() => {
    if (dragging.value) return;
    step.value = Math.round(value / WHAT_IF_STEP);
    pos.value = withTiming(max > 0 ? value / max : 0, {
      duration: reduceMotion ? 0 : SETTLE_MS,
      easing: settle,
    });
  }, [value, max, pos, step, dragging, reduceMotion]);

  const follow = (x: number) => {
    'worklet';
    if (width.value <= 0) return;
    pos.value = Math.min(1, Math.max(0, x / width.value));
    const next = Math.round(pos.value * steps);
    if (next !== step.value) {
      step.value = next;
      runOnJS(onStep)(next * WHAT_IF_STEP);
    }
  };
  const land = () => {
    'worklet';
    dragging.value = false;
    pos.value = withTiming(step.value / steps, {
      duration: reduceMotion ? 0 : SETTLE_MS,
      easing: settle,
    });
    runOnJS(onCommit)(Math.min(max, step.value * WHAT_IF_STEP));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((e) => {
      dragging.value = true;
      follow(e.x);
    })
    .onUpdate((e) => follow(e.x))
    .onEnd(() => land());
  const tap = Gesture.Tap().onEnd((e) => {
    follow(e.x);
    land();
  });

  const fill = useAnimatedStyle(() => ({ width: pos.value * width.value }));
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * width.value - THUMB / 2 }],
  }));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const next = Math.min(
            max,
            Math.max(0, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1) * WHAT_IF_STEP),
          );
          onStep(next);
          onCommit(next);
        }}
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
          pos.value = max > 0 ? value / max : 0;
        }}
        style={{ height: HIT, marginVertical: (TRACK + 8 - HIT) / 2, justifyContent: 'center' }}
      >
        <View
          style={{
            height: TRACK,
            borderRadius: TRACK / 2,
            backgroundColor: colours.trackFill,
            borderWidth: 1,
            borderColor: colours.trackEdge,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: palette.accent },
              fill,
            ]}
          />
        </View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: palette.accent,
            },
            thumb,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
