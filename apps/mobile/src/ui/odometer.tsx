import { useEffect } from 'react';
import { Text, View, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

import { useMoneyFormat } from '../money/use-money-format';
import { display, tabular } from './type/fonts';
import { symbolStyle } from './type/symbol-face';

const ease = Easing.bezier(...curves.enter);
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitColumn({
  digit,
  height,
  position,
  textStyle,
}: {
  readonly digit: number;
  readonly height: number;
  readonly position: number;
  readonly textStyle: TextStyle;
}) {
  const offset = useSharedValue(-digit * height);
  useEffect(() => {
    offset.value = withTiming(-digit * height, {
      duration: durations.odometerBase + position * durations.odometerStep,
      easing: ease,
    });
  }, [digit, height, position, offset]);
  const rolling = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={[{ alignItems: 'center' }, rolling]}>
        {DIGITS.map((d) => (
          <Text key={d} style={[textStyle, { height, lineHeight: height }]}>
            {d}
          </Text>
        ))}
      </Animated.View>
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
}: {
  /** In minor units of the home currency. */
  readonly value: number;
  /** Font size of the digits, in points. */
  readonly size: number;
  readonly weight?: number;
  readonly letterSpacingEm?: number;
  readonly color: string;
}) {
  const money = useMoneyFormat();
  const height = Math.round(size * 1.04);
  const textStyle: TextStyle = { ...display(size, weight, letterSpacingEm), ...tabular, color };
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
      style={{ flexDirection: 'row', alignItems: 'flex-start', height }}
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
          />
        ) : (
          <Text key={`p${position}sep`} style={[textStyle, { height, lineHeight: height }]}>
            {c}
          </Text>
        );
      })}
      {after ? <Text style={[symbol, { marginLeft: size * 0.05 }]}>{after}</Text> : null}
    </View>
  );
}
