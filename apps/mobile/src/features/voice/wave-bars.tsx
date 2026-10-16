import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../ui/theme/theme';

/**
 * The prototype's bars, `wave <period> ease-in-out infinite` with a negative delay each: the
 * period in ms and how far into it each bar starts.
 */
const BARS = [
  { period: 900, at: 100 },
  { period: 700, at: 400 },
  { period: 1100, at: 200 },
  { period: 800, at: 600 },
  { period: 1000, at: 300 },
  { period: 750, at: 500 },
  { period: 950, at: 0 },
] as const;

/**
 * The shared clock every bar reads its own phase from, in ms. It is a whole number of every
 * period, so when it starts again no bar jumps.
 */
const CLOCK_MS = 52_668_000;
const inOut = Easing.inOut(Easing.ease);

function Bar({
  clock,
  period,
  at,
  width,
  height,
  radius,
}: {
  readonly clock: SharedValue<number>;
  readonly period: number;
  readonly at: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  // `wave`: scaleY .25 at the ends of the period, 1 halfway, eased in and out each way.
  const style = useAnimatedStyle(() => {
    if (reduceMotion) return { transform: [{ scaleY: 0.6 }] };
    const t = ((clock.value + at) % period) / period;
    const half = t < 0.5 ? t * 2 : (1 - t) * 2;
    return { transform: [{ scaleY: 0.25 + 0.75 * inOut(half) }] };
  });
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: palette.accent }, style]}
    />
  );
}

/** The accent bars that move while the microphone is listening. */
export function WaveBars({
  count,
  width,
  height,
  gap,
  radius,
}: {
  readonly count: number;
  readonly width: number;
  readonly height: number;
  readonly gap: number;
  readonly radius: number;
}) {
  const clock = useSharedValue(0);
  useEffect(() => {
    clock.value = withRepeat(
      withTiming(CLOCK_MS, { duration: CLOCK_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(clock);
  }, [clock]);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'center', gap }}>
      {BARS.slice(0, count).map((bar, i) => (
        <Bar
          key={i}
          clock={clock}
          period={bar.period}
          at={bar.at}
          width={width}
          height={height}
          radius={radius}
        />
      ))}
    </View>
  );
}
