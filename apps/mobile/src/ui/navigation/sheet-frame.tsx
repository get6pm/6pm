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

import { haptics } from '../haptics';
import { useDesignInsets } from '../layout/design-insets';
import { useTheme } from '../theme/theme';

const OPEN_MS = 450;
const CLOSE_MS = 260;
const open = Easing.bezier(0.2, 0.9, 0.2, 1);
const settle = Easing.bezier(0.2, 0.9, 0.25, 1.12);
const leave = Easing.bezier(0.4, 0, 1, 1);
/** A downward flick this fast (pt/s) dismisses even a short drag. */
const FLICK = 900;

/**
 * The prototype's sheet, exactly: 58 pt below the top, 40 pt corners, the solid sheet colour over
 * a dimmed page. It slides up over 0.45 s; drag its header down past 120 pt (or flick it) to
 * dismiss, with a rubber band upward and the dimming lifting as it goes.
 */
export function SheetFrame({
  header,
  children,
}: {
  /** The draggable top: grabber and title row. */
  readonly header: ReactNode;
  readonly children: ReactNode;
}) {
  const router = useRouter();
  const { palette } = useTheme();
  const { top } = useDesignInsets();
  const { height } = useWindowDimensions();
  const y = useSharedValue(height);
  const dim = useSharedValue(0);

  useEffect(() => {
    y.value = withTiming(0, { duration: OPEN_MS, easing: open });
    dim.value = withTiming(1, { duration: 300 });
  }, [y, dim]);

  const close = () => {
    haptics.tap();
    router.back();
  };
  const dismiss = () => {
    'worklet';
    y.value = withTiming(height, { duration: CLOSE_MS, easing: leave }, (done) => {
      if (done) runOnJS(close)();
    });
    dim.value = withTiming(0, { duration: CLOSE_MS });
  };

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      const dy = e.translationY;
      y.value = dy < 0 ? dy * 0.15 : dy;
      dim.value = Math.max(0.15, 1 - y.value / 480);
    })
    .onEnd((e) => {
      if (y.value > gestures.sheetDismiss || e.velocityY > FLICK) {
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
            left: 0,
            right: 0,
            top: top(58),
            bottom: 0,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            backgroundColor: palette.sheetSolid,
            boxShadow: '0 -20px 60px rgba(10,5,20,.35)',
            overflow: 'hidden',
          },
          panel,
        ]}
      >
        <GestureDetector gesture={drag}>
          <View>{header}</View>
        </GestureDetector>
        <View style={{ flex: 1 }}>{children}</View>
      </Animated.View>
    </View>
  );
}
