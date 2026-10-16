import { BlurView } from 'expo-blur';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useDesignInsets } from '../../ui/layout/design-insets';
import { useTheme } from '../../ui/theme/theme';
import { useHomeScroll } from './home-scroll';

/** Appends an alpha to a #rrggbb colour, as the prototype's `alpha()` does. */
function withAlpha(hex: string, alpha: number): string {
  return /^#[0-9a-f]{6}$/i.test(hex)
    ? hex +
        Math.round(alpha * 255)
          .toString(16)
          .padStart(2, '0')
    : hex;
}

/** Scroll travel over which the status-bar fade comes in: none at rest, so the header reads clean. */
const FADE_AFTER = 24;

/**
 * The compact bar that fades in once the page scrolls past its header: frosted sheet colour at
 * 84 %, a hairline underneath, sliding down 10 pt as it appears. Tapping it scrolls to the top.
 * Above it, a soft fade of the sky's top colour keeps the status bar readable once content scrolls
 * under it; at rest it is not drawn, so it never veils the page's own header.
 */
export function TopNav({
  onPressTop,
  edge,
  children,
}: {
  readonly onPressTop: () => void;
  /** What it leaves clear on the right: the Duo's side rail, or the month's page beside Today. */
  readonly edge: number;
  readonly children: ReactNode;
}) {
  const { palette } = useTheme();
  const { top } = useDesignInsets();
  const { y, nav } = useHomeScroll();

  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, FADE_AFTER], [0, 1], Extrapolation.CLAMP),
  }));
  const shown = useAnimatedStyle(() => ({
    opacity: nav.value,
    transform: [{ translateY: (1 - nav.value) * -10 }],
  }));
  // The bar takes touches only once it is more than half there. A plain prop flipped at that
  // threshold is reliable on Fabric, where an animated `pointerEvents` is not guaranteed to
  // reach the native view; the bar is invisible, and must not swallow taps, until then.
  const [touchable, setTouchable] = useState(false);
  useAnimatedReaction(
    () => nav.value > 0.5,
    (on, previous) => {
      if (on !== previous) runOnJS(setTouchable)(on);
    },
  );

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: edge,
            top: 0,
            height: top(96),
            experimental_backgroundImage: `linear-gradient(180deg, ${palette.st[0]} 0%, ${palette.st[0]}00 100%)`,
          },
          fade,
        ]}
      />
      <Animated.View
        pointerEvents={touchable ? 'auto' : 'none'}
        style={[{ position: 'absolute', left: 0, right: edge, top: 0 }, shown]}
      >
        <BlurView
          intensity={60}
          tint={palette.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: withAlpha(palette.sheet, 0.84),
              borderBottomWidth: 0.5,
              borderBottomColor: palette.hair,
            },
          ]}
        />
        <Pressable
          onPress={onPressTop}
          style={{
            paddingTop: top(52),
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 10,
            gap: 9,
          }}
        >
          {children}
        </Pressable>
      </Animated.View>
    </>
  );
}
