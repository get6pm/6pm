import { useEffect } from 'react';
import { Text, View, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
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

function DigitColumn({
  digit,
  height,
  position,
  textStyle,
  glows,
  bleed,
}: {
  readonly digit: number;
  readonly height: number;
  /** Points the column reaches above and below its line, so a tall face is never cut off. */
  readonly bleed: number;
  readonly position: number;
  readonly textStyle: TextStyle;
  readonly glows: readonly TextStyle[];
}) {
  const offset = useSharedValue(-digit * height);
  const lit = useSharedValue(1);
  useEffect(() => {
    const duration = durations.odometerBase + position * durations.odometerStep;
    if (offset.value === -digit * height) return;
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
 * that grows a digit keeps its other columns rolling smoothly. The amount is drawn without its
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
  return (
    <View
      accessible
      accessibilityLabel={money.spoken(Math.abs(value))}
      style={{ flexDirection: 'row', alignItems: 'flex-start', height: line }}
    >
      {before ? <Text style={[symbol, { marginRight: size * 0.05 }]}>{before}</Text> : null}
      {chars.map((c, i) => {
        const position = n - i;
        return /\d/.test(c) ? (
          <DigitColumn
            key={`p${position}`}
            digit={Number(c)}
            height={height}
            position={position}
            textStyle={textStyle}
            glows={glows}
            bleed={bleed}
          />
        ) : (
          <View key={`p${position}sep`} style={{ marginTop: -bleed }}>
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
                {c}
              </Text>
            ))}
            <Text style={[textStyle, { height, lineHeight: height }]}>{c}</Text>
          </View>
        );
      })}
      {after ? <Text style={[symbol, { marginLeft: size * 0.05 }]}>{after}</Text> : null}
    </View>
  );
}
