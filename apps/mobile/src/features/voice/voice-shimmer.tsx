import { useEffect } from 'react';
import { View } from 'react-native';
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

const WIDTH = 160;
/** The prototype's `shimmer 1.1s linear infinite`. */
const SHIMMER_MS = 1100;

/**
 * The thin accent line that sweeps across while what was said is being read, fading out at both
 * ends.
 */
export function VoiceShimmer() {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const sweep = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    sweep.value = withRepeat(
      withTiming(1, { duration: SHIMMER_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(sweep);
  }, [reduceMotion, sweep]);
  const light = useAnimatedStyle(() => ({
    transform: [{ translateX: WIDTH * (1 - 2 * sweep.value) }],
  }));
  return (
    <View style={{ width: WIDTH, height: 3, borderRadius: 3, overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            width: WIDTH,
            height: 3,
            experimental_backgroundImage: `linear-gradient(90deg, transparent 20%, ${palette.accent} 50%, transparent 80%)`,
          },
          reduceMotion ? null : light,
        ]}
      />
    </View>
  );
}
