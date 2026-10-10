import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * The prototype's scroll-driven `reveal` (`animation-timeline: view()`, range entry 0% → 85%):
 * as a card comes up from the bottom edge it rises 28 pt, grows from 97% and fades in, tied to
 * the scroll position on the UI thread. With Reduce Motion it simply sits there.
 */
export function Reveal({
  y,
  viewport,
  onLayout,
  gap,
  children,
}: {
  readonly y: SharedValue<number>;
  readonly viewport: SharedValue<number>;
  readonly onLayout?: (e: LayoutChangeEvent) => void;
  readonly gap?: number;
  readonly children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const top = useSharedValue(0);
  const height = useSharedValue(0);
  const animated = useAnimatedStyle(() => {
    if (reduceMotion || height.value === 0 || viewport.value === 0) return {};
    const entered = y.value + viewport.value - top.value;
    const p = Math.min(1, Math.max(0, entered / (height.value * 0.85)));
    return {
      opacity: p,
      transform: [{ translateY: 28 * (1 - p) }, { scale: 0.97 + 0.03 * p }],
    };
  });
  return (
    <Animated.View
      style={[gap === undefined ? null : { gap }, animated]}
      onLayout={(e) => {
        top.value = e.nativeEvent.layout.y;
        height.value = e.nativeEvent.layout.height;
        onLayout?.(e);
      }}
    >
      {children}
    </Animated.View>
  );
}
