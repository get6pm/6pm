import { useEffect, useRef } from 'react';
import { Text, View, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  type LayoutAnimation,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

import { useMoneyFormat } from '../money/use-money-format';
import { display, tabular, withOpticalSize } from './type/fonts';
import { symbolStyle } from './type/symbol-face';
import { shadowRoom } from './type/text-shadow';

const ease = Easing.bezier(...curves.enter);
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const NO_GLOWS: readonly TextStyle[] = [];

/** How fast a resting digit's glow comes back once its column stops rolling. */
const GLOW_IN_MS = 300;

/**
 * A column the number grows (99 → 100, 0 → 45.000) opens from nothing to its width while it
 * fades in and rolls up from 0; one it loses closes and fades. The columns beside it glide to
 * their new places on the same curve, so the number never jumps.
 */
const widthTiming = { duration: durations.screen, easing: ease };
const slide = LinearTransition.duration(durations.screen).easing(ease);

function columnIn(values: EntryAnimationsValues): LayoutAnimation {
  'worklet';
  return {
    initialValues: { width: 0, opacity: 0 },
    animations: {
      width: withTiming(values.targetWidth, widthTiming),
      opacity: withTiming(1, widthTiming),
    },
  };
}

function columnOut(values: ExitAnimationsValues): LayoutAnimation {
  'worklet';
  return {
    initialValues: { width: values.currentWidth, opacity: 1 },
    animations: { width: withTiming(0, widthTiming), opacity: withTiming(0, widthTiming) },
  };
}

function DigitColumn({
  digit,
  height,
  position,
  textStyle,
  glows,
  bleed,
  rollIn,
}: {
  readonly digit: number;
  /** A column the number grew: it rolls up from 0 instead of starting on its digit. */
  readonly rollIn: boolean;
  readonly height: number;
  /** Points the column reaches above and below its line, so a tall face is never cut off. */
  readonly bleed: number;
  readonly position: number;
  readonly textStyle: TextStyle;
  readonly glows: readonly TextStyle[];
}) {
  const offset = useSharedValue(rollIn ? 0 : -digit * height);
  const lit = useSharedValue(rollIn ? 0 : 1);
  useEffect(() => {
    const duration = durations.odometerBase + position * durations.odometerStep;
    if (offset.value === -digit * height) {
      // A column that grew in on its own digit (a 0) has nothing to roll: its glow comes back.
      if (lit.value < 1) lit.value = withTiming(1, { duration: GLOW_IN_MS });
      return;
    }
    offset.value = withTiming(-digit * height, { duration, easing: ease });
    // A glow would be cut off at the column's edges while it rolls: it rests with the digit.
    lit.value = 0;
    lit.value = withDelay(duration, withTiming(1, { duration: GLOW_IN_MS }));
  }, [digit, height, position, offset, lit]);
  const rolling = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const glowing = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <View style={{ marginTop: -bleed }}>
      {glows.map((glow, i) => (
        <Animated.Text
          key={i}
          style={[
            textStyle,
            glow,
            {
              position: 'absolute',
              left: -shadowRoom(glow),
              right: -shadowRoom(glow),
              top: -shadowRoom(glow),
              padding: shadowRoom(glow),
              textAlign: 'center',
              height: height + 2 * shadowRoom(glow),
              lineHeight: height,
            },
            glowing,
          ]}
        >
          {digit}
        </Animated.Text>
      ))}
      <View style={{ height, overflow: 'hidden' }}>
        <Animated.View style={[{ alignItems: 'center' }, rolling]}>
          {DIGITS.map((d) => (
            <Text key={d} style={[textStyle, { height, lineHeight: height }]}>
              {d}
            </Text>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * A rolling amount: each digit is a column that scrolls to its value, the leftmost taking longest
 * (1000 ms + 80 ms per position), with the currency symbol small and raised beside it (after it for
 * ₫ and "12,50 €", before it for "$"). Columns are keyed by position from the right, so a number
 * that grows a digit keeps its other columns rolling smoothly, and the column it gains opens and
 * rolls in (the one it loses closes) while the rest glide aside. The amount is drawn without its
 * sign; a hero puts it in `FitWidth` so a long one shrinks to its row.
 */
export function Odometer({
  value,
  size,
  weight = 400,
  letterSpacingEm = 0,
  color,
  glows = NO_GLOWS,
  opsz = null,
}: {
  /** In minor units of the home currency. */
  readonly value: number;
  /** Font size of the digits, in points. */
  readonly size: number;
  readonly weight?: number;
  readonly letterSpacingEm?: number;
  readonly color: string;
  /** Text shadows the look gives its hero number (`heroGlow`), one per layer. */
  readonly glows?: readonly TextStyle[];
  /** An optical size the look pins its hero number to (`heroVar`), else the font size's. */
  readonly opsz?: number | null;
}) {
  const money = useMoneyFormat();
  const line = Math.round(size * 1.04);
  // Each digit is set on a taller line than the prototype's 1.04 em and pulled back up by the
  // difference: iOS cuts a glyph off at its line, and some look faces rise above it.
  const bleed = Math.round(size * 0.16);
  const height = line + 2 * bleed;
  const textStyle: TextStyle = {
    ...withOpticalSize(display(size, weight, letterSpacingEm), opsz),
    ...tabular,
    color,
  };
  const parts = money.parts(Math.abs(value));
  const before = parts.prefix.trim();
  const after = parts.suffix.trim();
  const symbol = symbolStyle(
    {
      ...display(size * 0.4, weight),
      color,
      lineHeight: size * 0.4,
      marginTop: size * 0.14,
      opacity: 0.55,
    },
    before || after,
  );
  const chars = parts.number.split('');
  const n = chars.length;
  // Columns drawn on the first render stand on their digits; any the number grows later roll in.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return (
    <View
      accessible
      accessibilityLabel={money.spoken(Math.abs(value))}
      style={{ flexDirection: 'row', alignItems: 'flex-start', height: line }}
    >
      <LayoutAnimationConfig skipEntering skipExiting>
        {before ? (
          <Animated.Text layout={slide} style={[symbol, { marginRight: size * 0.05 }]}>
            {before}
          </Animated.Text>
        ) : null}
        {chars.map((c, i) => {
          const position = n - i;
          const digit = /\d/.test(c);
          return (
            <Animated.View
              key={digit ? `p${position}` : `p${position}sep`}
              entering={columnIn}
              exiting={columnOut}
              layout={slide}
            >
              {digit ? (
                <DigitColumn
                  digit={Number(c)}
                  height={height}
                  position={position}
                  textStyle={textStyle}
                  glows={glows}
                  bleed={bleed}
                  rollIn={mounted.current}
                />
              ) : (
                <Separator
                  char={c}
                  height={height}
                  bleed={bleed}
                  textStyle={textStyle}
                  glows={glows}
                />
              )}
            </Animated.View>
          );
        })}
        {after ? (
          <Animated.Text layout={slide} style={[symbol, { marginLeft: size * 0.05 }]}>
            {after}
          </Animated.Text>
        ) : null}
      </LayoutAnimationConfig>
    </View>
  );
}

/** A group or decimal mark between digit columns, glowing as the digits do. */
function Separator({
  char,
  height,
  bleed,
  textStyle,
  glows,
}: {
  readonly char: string;
  readonly height: number;
  readonly bleed: number;
  readonly textStyle: TextStyle;
  readonly glows: readonly TextStyle[];
}) {
  return (
    <View style={{ marginTop: -bleed }}>
      {glows.map((glow, g) => (
        <Text
          key={g}
          style={[
            textStyle,
            glow,
            {
              position: 'absolute',
              left: -shadowRoom(glow),
              top: -shadowRoom(glow),
              padding: shadowRoom(glow),
              height: height + 2 * shadowRoom(glow),
              lineHeight: height,
            },
          ]}
        >
          {char}
        </Text>
      ))}
      <Text style={[textStyle, { height, lineHeight: height }]}>{char}</Text>
    </View>
  );
}
