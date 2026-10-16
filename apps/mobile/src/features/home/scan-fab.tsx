import { memo, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { gestures } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { useTheme } from '../../ui/theme/theme';
import { nativeReach } from '../surfaces/native-reach';
import { useHomeScroll } from './home-scroll';

const PRESS_IN = { duration: 100, easing: easeOut, reduceMotion: ReduceMotion.System } as const;
const PRESS_OUT = { duration: 150, easing: easeOut, reduceMotion: ReduceMotion.System } as const;
const FULL = 64;
/** How much the button loses when the tab bar condenses: 64 → 52 pt, anchored bottom right. */
const SHRINK = 12;

/**
 * The scan button beside the tab bar. Tap to scan a VietQR; hold for half a second to jump
 * straight to Quick add (with a tap of haptics when it triggers). It shrinks with the tab bar.
 * On a phone without Scan it is Quick add's button: a plus, and a tap opens Quick add.
 *
 * It keeps a fixed 64 pt slot. When it shrinks, only the coloured disc (a childless layer out of
 * the flow) changes size, so its shadow and hairline stay exactly as drawn; the glyph moves with
 * the disc's centre by transform and keeps its size.
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
  const { t } = useI18n();
  const { barMin } = useHomeScroll();
  const pressed = useSharedValue(0);

  // Read through a ref so the gestures are built once.
  const actions = useRef({ onScan, onQuickAdd });
  actions.current = { onScan, onQuickAdd };

  const gesture = useMemo(() => {
    const scan = () => (nativeReach.scan ? actions.current.onScan() : actions.current.onQuickAdd());
    const longPressed = () => {
      haptics.tap();
      actions.current.onQuickAdd();
    };
    const tap = Gesture.Tap()
      .maxDuration(gestures.fabLongPressMs)
      .onEnd((_e, success) => {
        if (success) scheduleOnRN(scan);
      });
    const hold = Gesture.LongPress()
      .minDuration(gestures.fabLongPressMs)
      .onStart(() => {
        scheduleOnRN(longPressed);
      });
    const press = Gesture.Manual()
      .onTouchesDown(() => {
        pressed.set(withTiming(1, PRESS_IN));
      })
      .onTouchesUp(() => {
        pressed.set(withTiming(0, PRESS_OUT));
      })
      .onTouchesCancelled(() => {
        pressed.set(withTiming(0, PRESS_OUT));
      });
    return Gesture.Simultaneous(press, Gesture.Exclusive(hold, tap));
  }, [pressed]);

  // The disc and glyph share a frame centred on the disc; the press sinks both about that centre.
  const frame = useAnimatedStyle(() => {
    const half = (SHRINK / 2) * barMin.get();
    return {
      transform: [{ translateX: half }, { translateY: half }, { scale: 1 - 0.05 * pressed.get() }],
    };
  });
  const disc = useAnimatedStyle(() => {
    const inset = (SHRINK / 2) * barMin.get();
    const d = FULL - 2 * inset;
    return { left: inset, top: inset, width: d, height: d, borderRadius: d / 2 };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={nativeReach.scan ? label : t('home.quickAdd')}
        accessibilityHint={nativeReach.scan ? hint : undefined}
        style={{ width: FULL, height: FULL }}
      >
        <Animated.View
          style={[{ position: 'absolute', left: 0, top: 0, width: FULL, height: FULL }, frame]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                backgroundColor: palette.accent,
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,.45)',
                boxShadow: `0 10px 28px ${palette.accentGlow}, inset 0 1px 0 rgba(255,255,255,.5)`,
              },
              disc,
            ]}
          />
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            pointerEvents="none"
          >
            <Symbol
              name={nativeReach.scan ? 'qr_code_scanner' : 'add'}
              size={30}
              color={palette.accentFg}
            />
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
});
