import { useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const THUMB = 28;
const TRACK = 4;
const HEIGHT = 32;

/**
 * The look's intensity, 0–100: a 4 pt track filled to the thumb with the look's accent, and a
 * 28 pt white thumb. A touch anywhere on it jumps there and drags; `onChange` fires on each whole
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
    position.value = value;
    last.value = value;
  }, [value, position, last]);

  const apply = (x: number) => {
    'worklet';
    const room = Math.max(1, width.value - THUMB);
    const next = Math.round(Math.min(1, Math.max(0, (x - THUMB / 2) / room)) * 100);
    position.value = next;
    if (next !== last.value) {
      last.value = next;
      runOnJS(onChange)(next);
    }
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => apply(e.x))
    .onUpdate((e) => apply(e.x))
    .onEnd(() => runOnJS(onCommit)(last.value));

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: (position.value / 100) * Math.max(0, width.value - THUMB) }],
  }));
  const fill = useAnimatedStyle(() => ({
    width: (position.value / 100) * Math.max(0, width.value - THUMB) + THUMB / 2,
  }));

  return (
    <GestureDetector gesture={pan}>
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
          width.value = e.nativeEvent.layout.width;
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
