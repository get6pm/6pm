import { useEffect } from 'react';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { oklchSrgbHex } from '@6pm/theme';

import { haptics } from '../haptics';
import { useTheme } from '../theme/theme';
import { PressScale } from './press-scale';

const ON = oklchSrgbHex(0.72, 0.15, 150);
/** The knob overshoots a little as it lands, as the prototype's `cubic-bezier(.3,1.4,.5,1)`. */
const knobEase = Easing.bezier(0.3, 1.4, 0.5, 1);

/** The prototype's 51 × 31 switch: green when on, the knob sliding 20 pt with a small overshoot. */
export function Switch({
  value,
  onChange,
  accessibilityLabel,
}: {
  readonly value: boolean;
  readonly onChange: (next: boolean) => void;
  readonly accessibilityLabel: string;
}) {
  const { palette } = useTheme();
  const off = palette.dark ? 'rgba(255,255,255,.18)' : 'rgba(27,30,46,.14)';
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(value ? 1 : 0, { duration: 250, easing: knobEase });
  }, [on, value]);
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(Math.min(1, Math.max(0, on.value)), [0, 1], [off, ON]),
  }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * 20 }] }));
  return (
    <PressScale
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => {
        haptics.tick();
        onChange(!value);
      }}
      hitSlop={6}
    >
      <Animated.View style={[{ width: 51, height: 31, borderRadius: 99, padding: 2 }, track]}>
        <Animated.View
          style={[
            {
              width: 27,
              height: 27,
              borderRadius: 14,
              backgroundColor: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,.22)',
            },
            knob,
          ]}
        />
      </Animated.View>
    </PressScale>
  );
}
