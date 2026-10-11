import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
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

const OPEN_MS = 450;
const CLOSE_MS = 260;
const open = Easing.bezier(0.2, 0.9, 0.2, 1);
const settle = Easing.bezier(0.2, 0.9, 0.25, 1.12);
const leave = Easing.bezier(0.4, 0, 1, 1);
const FLICK = 900;

/**
 * The Max sheet's own frame (prototype `App:1005-1006`): always the dark page colour whatever the
 * look, 40 pt corners, 58 pt from the top, over a darker dim. Drag the top down to dismiss, as every sheet in the app.
 */
export function MaxSheetFrame({
  children,
}: {
  /** The sheet's content, given the gesture that pulls it down to put on the part a finger grabs. */
  readonly children: (drag: ReturnType<typeof Gesture.Pan>) => ReactNode;
}) {
  const router = useRouter();
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
    // Only a downward pull takes the sheet; an upward one is the scroll's.
    .activeOffsetY(8)
    .failOffsetY(-8)
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
          style={{ flex: 1, backgroundColor: 'rgba(6,4,12,.5)' }}
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
            backgroundColor: '#0f0c14',
            boxShadow: '0 -20px 60px rgba(0,0,0,.5)',
            overflow: 'hidden',
          },
          panel,
        ]}
      >
        {children(drag)}
      </Animated.View>
    </View>
  );
}
