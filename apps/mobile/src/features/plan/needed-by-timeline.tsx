import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { NEEDED_BY_REACH_MONTHS, neededByMarks, neededByOffset } from '@6pm/domain';
import { curves } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { useTheme } from '../../ui/theme/theme';
import { mono } from '../../ui/type/fonts';
import { FAINTER, type PotSheetColours } from './pot-sheet-colours';

const settle = Easing.bezier(...curves.house);
const SETTLE_MS = 260;
const BOX = 44;
const BAR = 12;
const BAR_TOP = 16;
const THUMB = 32;
const RING = 4;
const STRIPE = 4;

/** The prototype's 135° amber stripes, 4 pt each, as hard stops along the gradient line. */
function stripes(width: number, a: string, b: string): string {
  const length = Math.ceil((width + BAR) / Math.SQRT2) + STRIPE * 2;
  const stops: string[] = [];
  for (let at = 0, k = 0; at < length; at += STRIPE, k++) {
    const colour = k % 2 === 0 ? a : b;
    stops.push(`${colour} ${at}px`, `${colour} ${at + STRIPE}px`);
  }
  return `linear-gradient(135deg, ${stops.join(', ')})`;
}

/**
 * Ten years from the pay cycle's month as a line to drag along: amber stripes where the plan
 * cannot set enough aside each month, green from the first month that fits, a mark at that month.
 * The thumb follows the finger on the UI thread; each new month goes to JS once, a year boundary
 * ticks, and letting go settles on the month. A month picked elsewhere (‹ ›, a chip) glides there.
 */
export function NeededByTimeline({
  from,
  month,
  fitsFrom,
  colours,
  label,
  onChange,
}: {
  readonly from: string;
  /** The month set, or null for no date (the thumb rests faded on the cycle's month). */
  readonly month: string | null;
  /**
   * The first month whose set-aside fits; null when none does within the reach; undefined when
   * there is nothing to measure against (the line is plain).
   */
  readonly fitsFrom: string | null | undefined;
  readonly colours: PotSheetColours;
  readonly label: string;
  /** Months from the pay cycle's month, 0 to the reach. */
  readonly onChange: (offset: number) => void;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const offset = month === null ? 0 : neededByOffset(from, month);
  const [width, setWidth] = useState(0);
  const span = useSharedValue(0);
  const pos = useSharedValue(offset / NEEDED_BY_REACH_MONTHS);
  const step = useSharedValue(offset);
  const dragging = useSharedValue(false);

  useEffect(() => {
    if (dragging.value) return;
    step.value = offset;
    pos.value = withTiming(offset / NEEDED_BY_REACH_MONTHS, {
      duration: reduceMotion ? 0 : SETTLE_MS,
      easing: settle,
    });
  }, [offset, pos, step, dragging, reduceMotion]);

  const follow = (x: number) => {
    'worklet';
    const room = span.value - THUMB;
    if (room <= 0) return;
    pos.value = Math.min(1, Math.max(0, (x - THUMB / 2) / room));
    const next = Math.round(pos.value * NEEDED_BY_REACH_MONTHS);
    if (next !== step.value) {
      if (Math.floor(next / 12) !== Math.floor(step.value / 12)) runOnJS(haptics.tick)();
      step.value = next;
      runOnJS(onChange)(next);
    }
  };
  const land = () => {
    'worklet';
    dragging.value = false;
    pos.value = withTiming(step.value / NEEDED_BY_REACH_MONTHS, {
      duration: reduceMotion ? 0 : SETTLE_MS,
      easing: settle,
    });
    runOnJS(onChange)(step.value);
  };
  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((e) => {
      dragging.value = true;
      follow(e.x);
    })
    .onUpdate((e) => follow(e.x))
    .onEnd(() => land());
  const tap = Gesture.Tap().onEnd((e) => {
    follow(e.x);
    land();
  });

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * Math.max(0, span.value - THUMB) }],
  }));
  // Where the line turns green, on the same scale the thumb travels.
  const along = (k: number) =>
    THUMB / 2 + (k / NEEDED_BY_REACH_MONTHS) * Math.max(0, width - THUMB);
  const fitAt =
    fitsFrom === undefined || fitsFrom === null ? null : along(neededByOffset(from, fitsFrom));
  const plain = fitsFrom === undefined;

  return (
    <View style={{ gap: 8 }}>
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min: 0, max: NEEDED_BY_REACH_MONTHS, now: offset }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            onChange(
              Math.min(
                NEEDED_BY_REACH_MONTHS,
                Math.max(0, offset + (e.nativeEvent.actionName === 'increment' ? 1 : -1)),
              ),
            )
          }
          onLayout={(e) => {
            span.value = e.nativeEvent.layout.width;
            setWidth(e.nativeEvent.layout.width);
          }}
          style={{ height: BOX }}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: BAR_TOP,
              height: BAR,
              borderRadius: BAR / 2,
              overflow: 'hidden',
              backgroundColor: plain ? palette.chipBg : colours.stripeB,
              experimental_backgroundImage:
                plain || width === 0 ? undefined : stripes(width, colours.stripeA, colours.stripeB),
            }}
          >
            {plain ? null : (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  left: fitAt ?? width,
                  backgroundColor: colours.green,
                }}
              />
            )}
          </View>
          {fitAt === null || fitAt <= THUMB / 2 ? null : (
            <View
              style={{
                position: 'absolute',
                left: fitAt - 1,
                top: 8,
                width: 2,
                height: 28,
                borderRadius: 1,
                backgroundColor: colours.marker,
              }}
            />
          )}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: (BOX - THUMB) / 2,
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                backgroundColor: palette.btnBg,
                boxShadow: `0 0 0 ${RING}px ${palette.cell}, 0 3px 8px rgba(27,30,46,.25)`,
                opacity: month === null ? 0.4 : 1,
              },
              thumb,
            ]}
          />
        </View>
      </GestureDetector>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {neededByMarks(from).map((year) => (
          <Text key={year} style={{ ...mono(11, 400), color: palette.inkSoft, opacity: FAINTER }}>
            {year}
          </Text>
        ))}
      </View>
    </View>
  );
}
