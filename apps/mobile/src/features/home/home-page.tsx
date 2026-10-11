import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { ScreenActivityProvider } from '../../ui/sky/screen-activity';

/**
 * One tab's page. Every page stays laid out under the others; the one on screen is the one whose
 * index the UI thread holds, so a tab switch shows and hides pages without waiting for React. A
 * hidden page keeps its views (nothing mounts or unmounts mid-slide), takes no touches and is
 * hidden from VoiceOver. Its drawings run only while it is the page on screen and Home is visible.
 */
export function HomePage({
  index,
  tabIndex,
  homeVisible,
  shown,
  children,
}: {
  readonly index: number;
  readonly tabIndex: SharedValue<number>;
  readonly homeVisible: SharedValue<boolean>;
  /** The page is the committed tab (for touches and VoiceOver, which are not animated). */
  readonly shown: boolean;
  readonly children: ReactNode;
}) {
  const style = useAnimatedStyle(() => ({ opacity: tabIndex.value === index ? 1 : 0 }));
  const active = useDerivedValue(() => homeVisible.value && tabIndex.value === index);
  return (
    <Animated.View
      pointerEvents={shown ? 'auto' : 'none'}
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      style={[StyleSheet.absoluteFill, style]}
    >
      <ScreenActivityProvider active={active}>{children}</ScreenActivityProvider>
    </Animated.View>
  );
}
