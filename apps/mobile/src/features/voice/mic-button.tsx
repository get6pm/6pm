import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

import { Symbol } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

const press = Easing.bezier(...curves.enter);
/** The prototype's `ring 1.1s ease-out infinite`: scale 1 → 1.65 while fading from .5. */
const RING_MS = 1100;
const ringEase = Easing.out(Easing.ease);
/** On the dark plum the design uses for text on the accent. */
const ON_ACCENT = '#2a1424';

/**
 * The round accent microphone. Its touches come straight from the gesture handler, so a hold
 * starts the instant the finger lands and stops the instant it lifts, wherever it drifts.
 */
export function MicButton({
  size,
  glyph,
  shadow,
  label,
  hint,
  listening,
  disabled,
  onDown,
  onUp,
}: {
  readonly size: number;
  readonly glyph: number;
  readonly shadow: string;
  readonly label: string;
  /** What VoiceOver reads for the control. */
  readonly hint: string;
  readonly listening: boolean;
  readonly disabled?: boolean;
  readonly onDown: () => void;
  readonly onUp: () => void;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const ring = useSharedValue(0);
  const ringOn = useSharedValue(0);

  useEffect(() => {
    if (listening) {
      ringOn.value = withTiming(1, { duration: 120 });
      ring.value = 0;
      if (!reduceMotion) {
        ring.value = withRepeat(withTiming(1, { duration: RING_MS, easing: ringEase }), -1, false);
      }
    } else {
      cancelAnimation(ring);
      ringOn.value = withTiming(0, { duration: 200 });
    }
  }, [listening, reduceMotion, ring, ringOn]);

  const gesture = Gesture.Manual()
    .enabled(!disabled)
    .onTouchesDown((_e, manager) => {
      manager.activate();
      pressed.value = withTiming(1, { duration: durations.tap / 2, easing: press });
      runOnJS(onDown)();
    })
    .onTouchesUp((_e, manager) => {
      manager.end();
    })
    .onTouchesCancelled((_e, manager) => {
      manager.end();
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, { duration: durations.tap * 2, easing: press });
      runOnJS(onUp)();
    });

  const button = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.05 * pressed.value }],
  }));
  // Reduce Motion: a still halo instead of the pulse.
  const halo = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: 0.3 * ringOn.value, transform: [{ scale: 1.2 }] }
      : {
          opacity: 0.5 * (1 - ring.value) * ringOn.value,
          transform: [{ scale: 1 + 0.65 * ring.value }],
        },
  );

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            inset: 0,
            borderRadius: size / 2,
            backgroundColor: palette.accent,
          },
          halo,
        ]}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={hint}
          accessibilityState={{ disabled: !!disabled, busy: listening }}
          style={[
            {
              position: 'absolute',
              inset: 0,
              borderRadius: size / 2,
              backgroundColor: palette.accent,
              boxShadow: shadow,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: disabled ? 0.4 : 1,
            },
            button,
          ]}
        >
          <Symbol name="mic" size={glyph} color={ON_ACCENT} />
          <Text style={{ ...body(13, 650), color: ON_ACCENT }}>{label}</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
