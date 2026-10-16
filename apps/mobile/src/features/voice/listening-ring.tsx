import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../ui/theme/theme';

/** The prototype's `ring 1.1s ease-out infinite`: scale 1 → 1.65 while fading from .5. */
const RING_MS = 1100;

/**
 * The accent ring that pulses out of a microphone while it listens, behind the button. Reduce
 * Motion: a still halo instead of the pulse.
 */
export function ListeningRing({ on, radius }: { readonly on: boolean; readonly radius: number }) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const ring = useSharedValue(0);
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = withTiming(on ? 1 : 0, { duration: on ? 120 : 200 });
    if (on && !reduceMotion) {
      ring.value = 0;
      ring.value = withRepeat(
        withTiming(1, { duration: RING_MS, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(ring);
    }
  }, [on, reduceMotion, ring, shown]);
  const halo = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: 0.3 * shown.value, transform: [{ scale: 1.2 }] }
      : {
          opacity: 0.5 * (1 - ring.value) * shown.value,
          transform: [{ scale: 1 + 0.65 * ring.value }],
        },
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', inset: 0, borderRadius: radius, backgroundColor: palette.accent },
        halo,
      ]}
    />
  );
}
