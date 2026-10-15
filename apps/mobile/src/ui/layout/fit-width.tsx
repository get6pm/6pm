import { useRef, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

const ease = Easing.bezier(...curves.enter);

/** Wider than any amount at any size. */
const STAGE = 4096;

/**
 * Draws its child at its natural size and scales it down, from the left, when it is wider than
 * the space it has, as a long amount does in a hero number. The scale is a transform, so the
 * glyphs never re-lay out; it settles with the entrance curve when the child grows or shrinks,
 * and is set at once on the first layout so nothing ever draws past the edge. Centred, it sits in
 * the middle of its room at any scale, as the Close's and onboarding's big numbers do.
 */
export function FitWidth({
  height,
  align = 'left',
  children,
}: {
  /** The child's natural height, in points: the box shrinks with the scale. */
  readonly height: number;
  readonly align?: 'left' | 'center';
  readonly children: ReactNode;
}) {
  const scale = useSharedValue(1);
  // The room left beside the scaled child, halved when centred; read on the UI thread.
  const roomWidth = useSharedValue(0);
  const naturalWidth = useSharedValue(0);
  const room = useRef(0);
  const natural = useRef(0);
  const placed = useRef(false);

  const refit = () => {
    if (room.current <= 0 || natural.current <= 0) return;
    const next = Math.min(1, room.current / natural.current);
    if (!placed.current) {
      placed.current = true;
      scale.value = next;
    } else {
      scale.value = withTiming(next, { duration: durations.screen, easing: ease });
    }
  };
  const onRoom = (e: LayoutChangeEvent) => {
    room.current = e.nativeEvent.layout.width;
    roomWidth.value = room.current;
    refit();
  };
  const onNatural = (e: LayoutChangeEvent) => {
    natural.current = e.nativeEvent.layout.width;
    naturalWidth.value = natural.current;
    refit();
  };

  const box = useAnimatedStyle(() => ({ height: height * scale.value }));
  const centred = align === 'center';
  const content = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: centred
          ? Math.max(0, (roomWidth.value - naturalWidth.value * scale.value) / 2)
          : 0,
      },
      { scale: scale.value },
    ],
    // Hidden until both widths are known, so a centred child never shows at the left first.
    opacity: centred && (roomWidth.value <= 0 || naturalWidth.value <= 0) ? 0 : 1,
  }));

  return (
    <Animated.View style={[centred ? { alignSelf: 'stretch' } : null, box]}>
      <View onLayout={onRoom} style={{ position: 'absolute', left: 0, right: 0, height: 0 }} />
      {/* A stage far wider than any screen, so the child (a plain Text too) lays out on one line at
          its own width instead of wrapping to the room it has. */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: STAGE,
            flexDirection: 'row',
            alignItems: 'flex-start',
            transformOrigin: 'left top',
          },
          content,
        ]}
      >
        <View onLayout={onNatural}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
}
