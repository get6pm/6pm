import { useEffect, useRef } from 'react';
import { View, type TextStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

import { haptics } from '../haptics';
import { display, tabular } from '../type/fonts';
import {
  clampPosition,
  columnOffset,
  edgeFade,
  momentumIndex,
  rowAt,
  rowLook,
  rubberBand,
  wheelRowHeight,
} from './wheel-maths';

const SNAP = { duration: durations.snap, easing: Easing.bezier(...curves.snap) };
/** CSS `perspective(320px)` on each row. */
const PERSPECTIVE = 320;
const TEXT_ALIGN = { center: 'center', 'flex-start': 'left', 'flex-end': 'right' } as const;

export interface WheelProps {
  readonly items: readonly string[];
  readonly index: number;
  /** Called as the centred row changes: live while dragging, and with the row a fling lands on. */
  readonly onChange: (index: number) => void;
  /** Type size in points; a row is 1.4× this. */
  readonly size?: number;
  /** Rows on show: the chosen one and one or two either side. */
  readonly rows?: 3 | 5;
  readonly align?: 'center' | 'flex-start' | 'flex-end';
  readonly ink: string;
  /** Horizontal padding inside each row, in points. */
  readonly padX?: number;
  readonly width: number;
  /** What the wheel sets, for VoiceOver ("Payday"). */
  readonly label: string;
}

function Row({
  label,
  index,
  position,
  rowHeight,
  rows,
  tilt,
  textStyle,
  align,
  padX,
}: {
  readonly label: string;
  readonly index: number;
  readonly position: SharedValue<number>;
  readonly rowHeight: number;
  readonly rows: number;
  readonly tilt: boolean;
  readonly textStyle: TextStyle;
  readonly align: WheelProps['align'];
  readonly padX: number;
}) {
  const look = useAnimatedStyle(() => {
    const distance = index - position.value;
    const { opacity, scale, rotateX } = rowLook(distance);
    // The prototype masks the wheel's top and bottom; each row takes the mask at its centre.
    const centre = columnOffset(position.value, rowHeight, rows) + (index + 0.5) * rowHeight;
    const fade = edgeFade(centre / (rowHeight * rows));
    return {
      opacity: opacity * fade,
      transform: tilt
        ? [{ perspective: PERSPECTIVE }, { rotateX: `${rotateX}deg` }, { scale }]
        : [{ scale }],
    };
  });
  return (
    <Animated.View
      style={[{ height: rowHeight, justifyContent: 'center', paddingHorizontal: padX }, look]}
    >
      {/* The text spans the row and aligns inside it: text sized to its own width is measured
          short on Android under negative tracking, and cut to an ellipsis. */}
      <Animated.Text
        numberOfLines={1}
        allowFontScaling={false}
        style={[textStyle, { textAlign: TEXT_ALIGN[align ?? 'center'] }]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

/**
 * The iOS-style picker wheel: the column follows the finger on the UI thread with a rubber band past
 * the ends, a fling carries on and snaps to a row, and rows tilt away in 3D, fading and shrinking.
 * Each row passing the centre ticks. Reduce Motion keeps the rows flat.
 */
export function Wheel({
  items,
  index,
  onChange,
  size = 28,
  rows = 3,
  align = 'center',
  ink,
  padX = 4,
  width,
  label,
}: WheelProps) {
  const reduceMotion = useReducedMotion();
  const count = items.length;
  const rowHeight = wheelRowHeight(size);
  const position = useSharedValue(index);
  const start = useSharedValue(index);
  const chosen = useSharedValue(index);
  const touching = useSharedValue(false);
  /** Ticks belong to the user's own movement, not to a value set from outside. */
  const userMoved = useSharedValue(false);

  const latest = useRef(onChange);
  latest.current = onChange;
  const emitJs = (next: number) => latest.current(next);

  // A new value from outside (another control, a card coming back) glides the wheel to it.
  useEffect(() => {
    if (touching.value || chosen.value === index) return;
    chosen.value = index;
    userMoved.value = false;
    position.value = withTiming(index, SNAP);
  }, [index, position, chosen, touching, userMoved]);

  useAnimatedReaction(
    () => Math.round(clampPosition(position.value, count)),
    (now, before) => {
      if (before !== null && now !== before && userMoved.value) runOnJS(haptics.tick)();
    },
  );

  const emit = (next: number) => {
    'worklet';
    if (next === chosen.value) return;
    chosen.value = next;
    runOnJS(emitJs)(next);
  };
  const settle = (next: number) => {
    'worklet';
    position.value = withTiming(next, SNAP);
    emit(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-3, 3])
    .onBegin(() => {
      touching.value = true;
    })
    .onStart(() => {
      cancelAnimation(position);
      userMoved.value = true;
      start.value = position.value;
    })
    .onUpdate((e) => {
      const next = rubberBand(start.value - e.translationY / rowHeight, count);
      position.value = next;
      emit(Math.round(clampPosition(next, count)));
    })
    .onEnd((e) => {
      settle(momentumIndex(position.value, e.velocityY / 1000, rowHeight, count));
    })
    .onFinalize(() => {
      touching.value = false;
    });
  const tap = Gesture.Tap().onEnd((e) => {
    userMoved.value = true;
    settle(rowAt(e.y, position.value, rowHeight, rows, count));
  });

  const column = useAnimatedStyle(() => ({
    transform: [{ translateY: columnOffset(position.value, rowHeight, rows) }],
  }));

  const textStyle: TextStyle = { ...display(size, 600, -0.03), ...tabular, color: ink };

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: items[index] ?? '' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const step = e.nativeEvent.actionName === 'increment' ? 1 : -1;
          const next = Math.round(clampPosition(index + step, count));
          if (next !== index) onChange(next);
        }}
        style={{ width, height: rowHeight * rows, overflow: 'hidden' }}
      >
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, column]}>
          {items.map((item, i) => (
            <Row
              key={i}
              label={item}
              index={i}
              position={position}
              rowHeight={rowHeight}
              rows={rows}
              tilt={!reduceMotion}
              textStyle={textStyle}
              align={align}
              padX={padX}
            />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
