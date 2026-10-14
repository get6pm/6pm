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

/**
 * Draws its child at its natural size and scales it down, from the left, when it is wider than
 * the space it has, as a long amount does in a hero number. The scale is a transform, so the
 * glyphs never re-lay out; it settles with the entrance curve when the child grows or shrinks,
 * and is set at once on the first layout so nothing ever draws past the edge.
 */
export function FitWidth({
  height,
  children,
}: {
  /** The child's natural height, in points: the box shrinks with the scale. */
  readonly height: number;
  readonly children: ReactNode;
}) {
  const scale = useSharedValue(1);
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
    refit();
  };
  const onNatural = (e: LayoutChangeEvent) => {
    natural.current = e.nativeEvent.layout.width;
    refit();
  };

  const box = useAnimatedStyle(() => ({ height: height * scale.value }));
  const content = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={box}>
      <View onLayout={onRoom} style={{ position: 'absolute', left: 0, right: 0, height: 0 }} />
      <Animated.View
        onLayout={onNatural}
        style={[{ position: 'absolute', left: 0, top: 0, transformOrigin: 'left top' }, content]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}
