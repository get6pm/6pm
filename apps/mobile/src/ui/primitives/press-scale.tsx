import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ease = Easing.bezier(...curves.enter);

export interface PressScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  /** How far the control sinks while held: .95 for buttons, .97 for wide CTAs (the prototype's `:active`). */
  readonly scaleTo?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly children: ReactNode;
}

/** A pressable that sinks under the finger on the UI thread, like every control in the design. */
export function PressScale({ scaleTo = 0.95, style, children, ...rest }: PressScaleProps) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }],
  }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: durations.tap / 2, easing: ease });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: durations.tap * 2, easing: ease });
        rest.onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
