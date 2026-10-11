import { memo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves, gestures } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { useHomeScroll } from './home-scroll';

const ease = Easing.bezier(...curves.enter);

/**
 * The scan button beside the tab bar. Tap to scan a VietQR; hold for half a second to jump
 * straight to Quick add (with a tap of haptics when it triggers). It shrinks with the tab bar.
 */
export const ScanFab = memo(function ScanFab({
  label,
  hint,
  onScan,
  onQuickAdd,
}: {
  readonly label: string;
  readonly hint: string;
  readonly onScan: () => void;
  readonly onQuickAdd: () => void;
}) {
  const { palette } = useTheme();
  const { barMin } = useHomeScroll();
  const pressed = useSharedValue(0);

  const longPressed = () => {
    haptics.tap();
    onQuickAdd();
  };

  const tap = Gesture.Tap()
    .maxDuration(gestures.fabLongPressMs)
    .onEnd((_e, success) => {
      if (success) runOnJS(onScan)();
    });
  const hold = Gesture.LongPress()
    .minDuration(gestures.fabLongPressMs)
    .onStart(() => {
      runOnJS(longPressed)();
    });
  const press = Gesture.Manual()
    .onTouchesDown(() => {
      pressed.value = withTiming(1, { duration: 60, easing: ease });
    })
    .onTouchesUp(() => {
      pressed.value = withTiming(0, { duration: 240, easing: ease });
    })
    .onTouchesCancelled(() => {
      pressed.value = withTiming(0, { duration: 240, easing: ease });
    });

  const size = useAnimatedStyle(() => {
    const d = interpolate(barMin.value, [0, 1], [64, 52]);
    return {
      width: d,
      height: d,
      borderRadius: d / 2,
      transform: [{ scale: 1 - 0.05 * pressed.value }],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(press, Gesture.Exclusive(hold, tap))}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[
          {
            backgroundColor: palette.accent,
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,.45)',
            boxShadow: '0 10px 28px rgba(255,120,70,.38), inset 0 1px 0 rgba(255,255,255,.5)',
            alignItems: 'center',
            justifyContent: 'center',
          },
          size,
        ]}
      >
        <Symbol name="qr_code_scanner" size={30} color="#2a1424" />
      </Animated.View>
    </GestureDetector>
  );
});
