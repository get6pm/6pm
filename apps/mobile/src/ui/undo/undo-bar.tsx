import { useCallback, useMemo, useRef } from 'react';
import { Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeOutDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '../haptics';
import { Symbol } from '../icons/symbol';
import { project, release, rubberband } from '../motion/physics';
import { PressScale } from '../primitives/press-scale';
import { useTheme } from '../theme/theme';
import { body } from '../type/fonts';

const HEIGHT = 52;
/** A pull down past this (where the flick was heading) puts the bar away. */
const DISMISS_AT = HEIGHT / 2;
/** Far enough down to leave from above the tab bar. */
const GONE = 160;
const reduceMotion = ReduceMotion.System;
const barIn = FadeInDown.duration(300);
const barOut = FadeOutDown.duration(200);

/**
 * The undo pill itself. Pulled down it follows the finger and, let go heading down, leaves; held,
 * it tells its host to hold the countdown until the finger lifts.
 */
export function UndoBar({
  text,
  actionLabel,
  bottom,
  onUndo,
  onDismiss,
  onHold,
  onRelease,
}: {
  readonly text: string;
  readonly actionLabel: string;
  readonly bottom: number;
  readonly onUndo: () => void;
  readonly onDismiss: () => void;
  readonly onHold: () => void;
  readonly onRelease: () => void;
}) {
  const { palette } = useTheme();
  const y = useSharedValue(0);
  const start = useSharedValue(0);

  // Read through a ref so the host's fresh callbacks each render do not rebuild the gesture.
  const handlers = useRef({ onDismiss, onHold, onRelease });
  handlers.current = { onDismiss, onHold, onRelease };
  const dismissed = useCallback(() => handlers.current.onDismiss(), []);
  const held = useCallback(() => handlers.current.onHold(), []);
  const released = useCallback(() => handlers.current.onRelease(), []);

  const drag = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          scheduleOnRN(held);
        })
        .onStart(() => {
          start.set(y.get());
        })
        .onUpdate((e) => {
          const raw = start.get() + e.translationY;
          // Down follows the finger; up gives like rubber against the tab bar.
          y.set(raw >= 0 ? raw : rubberband(raw, HEIGHT));
        })
        .onEnd((e) => {
          const velocity = e.velocityY;
          if (y.get() + project(velocity) > DISMISS_AT) {
            scheduleOnRN(haptics.tap);
            y.set(
              withSpring(GONE, { ...release.away, velocity, reduceMotion }, (finished) => {
                if (finished) scheduleOnRN(dismissed);
              }),
            );
          } else {
            y.set(withSpring(0, { ...release.home, velocity, reduceMotion }));
          }
        })
        .onFinalize(() => {
          scheduleOnRN(released);
        }),
    [y, start, held, released, dismissed],
  );

  const follow = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return (
    <Animated.View
      entering={barIn}
      exiting={barOut}
      style={{ position: 'absolute', left: 16, right: 16, bottom }}
    >
      <GestureDetector gesture={drag}>
        <Animated.View
          style={[
            {
              height: HEIGHT,
              borderRadius: 18,
              backgroundColor: palette.btnBg,
              boxShadow: '0 12px 30px rgba(10,5,20,.3)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingLeft: 16,
              paddingRight: 6,
            },
            follow,
          ]}
        >
          <Symbol name="delete" size={20} color={palette.btnFg} />
          <Text numberOfLines={1} style={{ ...body(15, 500), color: palette.btnFg, flex: 1 }}>
            {text}
          </Text>
          <PressScale
            accessibilityRole="button"
            hitSlop={2}
            onPress={onUndo}
            style={{ height: 40, paddingHorizontal: 14, justifyContent: 'center' }}
          >
            <Text
              style={{ ...body(15, 700), color: palette.btnFg, textDecorationLine: 'underline' }}
            >
              {actionLabel}
            </Text>
          </PressScale>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
