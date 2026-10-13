import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const THUMB = 28;
const TRACK = 4;
const HEIGHT = 32;

/**
 * The look's intensity, 0–100: a 4 pt track filled to the thumb with the look's accent, and a
 * 28 pt white thumb. A tap sends the thumb there, a sideways drag carries it; `onChange` fires on each whole
 * step while it moves and `onCommit` once when the finger lifts.
 */
export function IntensitySlider({
  value,
  accent,
  trackColor,
  accessibilityLabel,
  onChange,
  onCommit,
}: {
  readonly value: number;
  readonly accent: string;
  readonly trackColor: string;
  readonly accessibilityLabel: string;
  readonly onChange: (value: number) => void;
  readonly onCommit: (value: number) => void;
}) {
  const width = useSharedValue(0);
  const position = useSharedValue(value);
  const last = useSharedValue(value);

  // The value also moves from outside (another look's own intensity).
  useEffect(() => {
    position.set(value);
    last.set(value);
  }, [value, position, last]);

  // Read through a ref so the parent's fresh callbacks each render do not rebuild the gestures.
  const handlers = useRef({ onChange, onCommit });
  handlers.current = { onChange, onCommit };
  const changed = useCallback((next: number) => handlers.current.onChange(next), []);
  const committed = useCallback((next: number) => handlers.current.onCommit(next), []);

  const gesture = useMemo(() => {
    const apply = (x: number) => {
      'worklet';
      const room = Math.max(1, width.get() - THUMB);
      const next = Math.round(Math.min(1, Math.max(0, (x - THUMB / 2) / room)) * 100);
      position.set(next);
      if (next !== last.get()) {
        last.set(next);
        scheduleOnRN(changed, next);
      }
    };
    // Sideways only once the finger has clearly gone sideways, so a scroll that starts on the
    // slider scrolls the sheet and leaves the value alone.
    const pan = Gesture.Pan()
      .activeOffsetX([-4, 4])
      .failOffsetY([-10, 10])
      .onStart((e) => apply(e.x))
      .onUpdate((e) => apply(e.x))
      .onEnd(() => scheduleOnRN(committed, last.get()));
    // A tap anywhere on the track jumps there.
    const tap = Gesture.Tap().onEnd((e, success) => {
      if (!success) return;
      apply(e.x);
      scheduleOnRN(committed, last.get());
    });
    return Gesture.Exclusive(pan, tap);
  }, [width, position, last, changed, committed]);

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: (position.get() / 100) * Math.max(0, width.get() - THUMB) }],
  }));
  const fill = useAnimatedStyle(() => ({
    width: (position.get() / 100) * Math.max(0, width.get() - THUMB) + THUMB / 2,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: 100, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const step = e.nativeEvent.actionName === 'increment' ? 10 : -10;
          const next = Math.min(100, Math.max(0, value + step));
          onChange(next);
          onCommit(next);
        }}
        onLayout={(e) => {
          width.set(e.nativeEvent.layout.width);
        }}
        style={{ height: HEIGHT, justifyContent: 'center' }}
      >
        <View style={{ height: TRACK, borderRadius: TRACK / 2, backgroundColor: trackColor }} />
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              height: TRACK,
              borderRadius: TRACK / 2,
              backgroundColor: accent,
            },
            fill,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,.25)',
            },
            thumb,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
