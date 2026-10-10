import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { useHomeScroll } from '../home/home-scroll';

/**
 * The prototype's scroll-driven `reveal`: a card rises 28 pt from 97% as it scrolls into view,
 * fully in once 85% of it has entered. Driven by the page's scroll offset on the UI thread; still
 * under Reduce Motion.
 */
export function ScrollReveal({ children }: { readonly children: ReactNode }) {
  const { y } = useHomeScroll();
  const { height: screen } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const top = useSharedValue(-1);
  const size = useSharedValue(1);
  const style = useAnimatedStyle(() => {
    if (reduceMotion || top.value < 0) return { opacity: 1, transform: [] };
    const entered = y.value + screen - top.value;
    const p = Math.max(0, Math.min(1, entered / (Math.min(size.value, screen) * 0.85)));
    return {
      opacity: p,
      transform: [{ translateY: 28 * (1 - p) }, { scale: 0.97 + 0.03 * p }],
    };
  });
  return (
    <Animated.View
      onLayout={(e) => {
        top.value = e.nativeEvent.layout.y;
        size.value = Math.max(1, e.nativeEvent.layout.height);
      }}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
