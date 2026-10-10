import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';

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

/**
 * The compact bar that fades in once the page scrolls past its header: frosted sheet colour at
 * 84 %, a hairline underneath, sliding down 10 pt as it appears. Tapping it scrolls to the top.
 * Above it, a soft fade of the sky's top colour keeps the status bar readable over content.
 */
export function TopNav({
  onPressTop,
  children,
}: {
  readonly onPressTop: () => void;
  readonly children: ReactNode;
}) {
  const { palette } = useTheme();
  const { top } = useDesignInsets();
  const { nav } = useHomeScroll();

  const shown = useAnimatedStyle(() => ({
    opacity: nav.value,
    transform: [{ translateY: (1 - nav.value) * -10 }],
  }));
  const touchable = useAnimatedProps(() => ({
    pointerEvents: nav.value > 0.5 ? ('auto' as const) : ('none' as const),
  }));

  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: top(96),
          experimental_backgroundImage: `linear-gradient(180deg, ${palette.st[0]} 0%, ${palette.st[0]}00 100%)`,
        }}
      />
      <Animated.View
        animatedProps={touchable}
        style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, shown]}
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
          style={{ paddingTop: top(52), paddingHorizontal: 16, paddingBottom: 10, gap: 9 }}
        >
          {children}
        </Pressable>
      </Animated.View>
    </>
  );
}
