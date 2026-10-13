import { createContext, use, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { ScreenActivityProvider } from '../../ui/sky/screen-activity';

const HomePageShownContext = createContext(true);

/**
 * Whether the page this is inside is the tab on show. Its scroll view takes the status-bar tap
 * only then: iOS ignores the tap when more than one scroll view on screen would take it.
 */
export function useHomePageShown(): boolean {
  return use(HomePageShownContext);
}

/**
 * One tab's page. The pages lie side by side, a screen width apart, and `position` (in pages,
 * 0 = Today) says which one is in view: a swipe moves it with the finger, a tap on the tab bar
 * jumps it. A page entirely out of view is not drawn. Every page keeps its views (nothing mounts
 * or unmounts mid-swipe); only the committed tab takes touches and is read by VoiceOver. Its
 * drawings run only while it is the tab on screen and Home is visible.
 */
export function HomePage({
  index,
  tabIndex,
  position,
  width,
  homeVisible,
  shown,
  children,
}: {
  readonly index: number;
  readonly tabIndex: SharedValue<number>;
  readonly position: SharedValue<number>;
  readonly width: number;
  readonly homeVisible: SharedValue<boolean>;
  /** The page is the committed tab (for touches and VoiceOver, which are not animated). */
  readonly shown: boolean;
  readonly children: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const away = index - position.get();
    return {
      opacity: Math.abs(away) < 1 ? 1 : 0,
      transform: [{ translateX: away * width }],
    };
  });
  const active = useDerivedValue(() => homeVisible.get() && tabIndex.get() === index);
  return (
    <Animated.View
      pointerEvents={shown ? 'auto' : 'none'}
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      style={[StyleSheet.absoluteFill, style]}
    >
      <HomePageShownContext value={shown}>
        <ScreenActivityProvider active={active}>{children}</ScreenActivityProvider>
      </HomePageShownContext>
    </Animated.View>
  );
}
