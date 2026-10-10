import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { gestures } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { useTheme } from '../../ui/theme/theme';

const OPEN_MS = 450;
const CLOSE_MS = 260;
const open = Easing.bezier(0.2, 0.9, 0.2, 1);
const settle = Easing.bezier(0.2, 0.9, 0.25, 1.12);
const leave = Easing.bezier(0.4, 0, 1, 1);
const FLICK = 900;

/**
 * The prototype's floating card sheet (the missed-day catch-up): 8 pt from the sides and bottom,
 * 44 pt corners, as tall as its content, over a dimmed page. Same physics as `SheetFrame`: it
 * slides up over 0.45 s and the grabber drags it down past 120 pt (or a flick) to dismiss.
 * The content gets the animated dismiss, so its own buttons leave the same way.
 */
export function CardSheet({ children }: { readonly children: (dismiss: () => void) => ReactNode }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { bottom } = useDesignInsets();
  const { height } = useWindowDimensions();
  const y = useSharedValue(height);
  const dim = useSharedValue(0);

  const close = () => router.back();
  const dismiss = () => {
    'worklet';
    y.value = withTiming(height, { duration: CLOSE_MS, easing: leave }, (done) => {
      if (done) runOnJS(close)();
    });
    dim.value = withTiming(0, { duration: CLOSE_MS });
  };

  useEffect(() => {
    y.value = withTiming(0, { duration: OPEN_MS, easing: open });
    dim.value = withTiming(1, { duration: 300 });
  }, [y, dim]);

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      y.value = e.translationY < 0 ? e.translationY * 0.15 : e.translationY;
      dim.value = Math.max(0.15, 1 - y.value / 480);
    })
    .onEnd((e) => {
      if (y.value > gestures.sheetDismiss || e.velocityY > FLICK) {
        runOnJS(haptics.tap)();
        dismiss();
      } else {
        y.value = withTiming(0, { duration: OPEN_MS, easing: settle });
        dim.value = withTiming(1, { duration: 300 });
      }
    });

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: dim.value }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => dismiss()}
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
        {children(() => dismiss())}
      </Animated.View>
    </View>
  );
}
