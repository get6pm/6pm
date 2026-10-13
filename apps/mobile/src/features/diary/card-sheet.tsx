import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { curves, gestures } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { project, release, rubberband } from '../../ui/motion/physics';
import { useTheme } from '../../ui/theme/theme';

const OPEN_MS = 450;
const enter = Easing.bezier(...curves.enter);
const reduceMotion = ReduceMotion.System;

/**
 * The prototype's floating card sheet (the missed-day catch-up): 8 pt from the sides and bottom,
 * 44 pt corners, as tall as its content, over a dimmed page. The native sheet cannot float like
 * this, so it draws itself: it slides up over 0.45 s, and the grabber drags it. Released, it goes
 * where the flick was heading: past 120 pt it leaves with the finger's speed, otherwise it springs
 * home. A grab mid-flight continues from where it is. The content gets the animated dismiss, so
 * its own buttons leave the same way.
 */
export function CardSheet({ children }: { readonly children: (dismiss: () => void) => ReactNode }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { bottom } = useDesignInsets();
  const { height } = useWindowDimensions();
  const y = useSharedValue(height);
  const start = useSharedValue(0);

  const close = useCallback(() => router.back(), [router]);
  const leave = useCallback(
    (velocity: number) => {
      'worklet';
      y.set(
        withSpring(height, { ...release.away, velocity, reduceMotion }, (done) => {
          if (done) scheduleOnRN(close);
        }),
      );
    },
    [y, height, close],
  );

  useEffect(() => {
    y.set(withTiming(0, { duration: OPEN_MS, easing: enter, reduceMotion }));
  }, [y]);

  const drag = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          start.set(y.get());
        })
        .onUpdate((e) => {
          const next = start.get() + e.translationY;
          y.set(next >= 0 ? next : rubberband(next, height));
        })
        .onEnd((e) => {
          // One light tap either way: it left, or it caught home.
          scheduleOnRN(haptics.tap);
          if (y.get() + project(e.velocityY) > gestures.sheetDismiss) leave(e.velocityY);
          else {
            y.set(withSpring(0, { ...release.sheet, velocity: e.velocityY, reduceMotion }));
          }
        }),
    [y, start, height, leave],
  );

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  // The dim follows the card: full when it is home, gone as it leaves.
  const backdrop = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, height], [1, 0], Extrapolation.CLAMP),
  }));
  const dismiss = () => leave(0);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
        <Pressable
          accessibilityRole="button"
          onPress={dismiss}
          style={{ flex: 1, backgroundColor: 'rgba(10,6,18,.36)' }}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: bottom(8),
            paddingTop: 8,
            paddingHorizontal: 20,
            paddingBottom: 22,
            borderRadius: 44,
            backgroundColor: palette.sheetSolid,
            borderWidth: 0.5,
            borderColor: palette.glassBorder,
            boxShadow: '0 30px 80px rgba(10,5,20,.4)',
            gap: 18,
          },
          panel,
        ]}
      >
        <GestureDetector gesture={drag}>
          <View
            style={{
              alignSelf: 'center',
              paddingVertical: 10,
              paddingHorizontal: 48,
              marginVertical: -10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 5,
                borderRadius: 9,
                backgroundColor: palette.inkSoft,
                opacity: 0.35,
              }}
            />
          </View>
        </GestureDetector>
        {children(dismiss)}
      </Animated.View>
    </View>
  );
}
