import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display, leading, mono } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { BILL_CARDS, type DeckItem } from './bill-deck';
import {
  billDigits,
  billMillionsItems,
  billOf,
  DIGITS,
  markAfter,
  zerosBelow,
} from './onboarding-maths';
import { tileOf, type OnboardingPalette } from './onboarding-palette';
import { WheelBand } from './step-parts';
import { useWheelMoney, WheelSymbol } from './wheel-money';

/** The bill millions wheel's width, and what a group mark inside its two digits adds. */
const MILLIONS_WIDTH = 54;
const INNER_MARK_WIDTH = 8;

/** The pieces a bills card is made of: buttons, the icon row, the question, the amount wheels. */

export function Pill({
  label,
  bg,
  fg,
  flex,
  height,
  radius = 99,
  onPress,
  children,
}: {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  /** Share of a row's width; leave it out in a column, where it would collapse the height. */
  readonly flex?: number;
  readonly height: number;
  readonly radius?: number;
  readonly onPress: () => void;
  readonly children?: ReactNode;
}) {
  const fill = useAnimatedStyle(() => ({ backgroundColor: withTiming(bg, { duration: 200 }) }));
  return (
    <PressScale
      scaleTo={height > 50 ? 0.96 : 0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ ...(flex === undefined ? {} : { flex }), minWidth: 0 }}
    >
      <Animated.View
        style={[
          { height, borderRadius: radius, alignItems: 'center', justifyContent: 'center' },
          fill,
        ]}
      >
        {children ?? (
          <Text style={{ ...body(height > 50 ? 16 : 15, 650), color: fg }}>{label}</Text>
        )}
      </Animated.View>
    </PressScale>
  );
}

export function CardTop({
  item,
  pal,
}: {
  readonly item: DeckItem;
  readonly pal: OnboardingPalette;
}) {
  const tile = tileOf(item.card.hue);
  const icon: SymbolName = item.type === 'amount' ? item.icon : item.card.icon;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 15,
          experimental_backgroundImage: tile.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name={icon} size={24} fill={1} color={tile.glyph} />
      </View>
      <Text style={{ ...mono(12, 400, 0.08), color: pal.inkSoft }}>
        {`${item.cardIndex + 1} / ${BILL_CARDS.length}`}
      </Text>
    </View>
  );
}

export function Question({
  q,
  sub,
  pal,
  onBottom,
}: {
  readonly q: string;
  readonly sub: string;
  readonly pal: OnboardingPalette;
  /** Where the subline ends, from the card's top: what the card needs above its own controls. */
  readonly onBottom?: (y: number) => void;
}) {
  return (
    <>
      <BalancedText
        style={{ ...leading({ ...display(26, 600, -0.025), paddingTop: 4 }, 27.3), color: pal.ink }}
      >
        {q}
      </BalancedText>
      <Text
        onLayout={(e) => onBottom?.(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
        style={{ ...body(13.5), lineHeight: 18.9, color: pal.inkSoft }}
      >
        {sub}
      </Text>
      <View style={{ flex: 1 }} />
    </>
  );
}

export function AmountWheels({
  value,
  ink,
  band,
  onValue,
}: {
  readonly value: number;
  readonly ink: string;
  /** The soft band behind the chosen row. */
  readonly band: string;
  readonly onValue: (value: number) => void;
}) {
  const w = useWheelMoney();
  const c = w.currency;
  const { millions, hundreds, tens } = billDigits(value, c);
  const number = { ...display(30, 600, -0.03), color: ink };
  const innerMark = markAfter(w.place + 1, w.mark) !== '';
  const afterMillions = markAfter(w.place, w.mark);
  const afterHundreds = markAfter(w.place - 1, w.mark);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <WheelBand height={44} radius={14} color={band} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <WheelSymbol symbol={w.before} size={15} offset={48} ink={ink} side="before" />
        <Wheel
          items={billMillionsItems(c, w.mark)}
          index={millions}
          onChange={(k) => onValue(billOf(k, hundreds, tens, c))}
          size={30}
          padX={0}
          align="flex-end"
          ink={ink}
          width={MILLIONS_WIDTH + (innerMark ? INNER_MARK_WIDTH : 0)}
          label={w.label('millions', 'onboarding.bills.millions')}
        />
        {afterMillions === '' ? null : <Text style={number}>{afterMillions}</Text>}
        <Wheel
          items={DIGITS}
          index={hundreds}
          onChange={(k) => onValue(billOf(millions, k, tens, c))}
          size={30}
          padX={0}
          ink={ink}
          width={19}
          label={w.label('hundreds', 'onboarding.bills.hundreds')}
        />
        {afterHundreds === '' ? null : <Text style={number}>{afterHundreds}</Text>}
        <Wheel
          items={DIGITS}
          index={tens}
          onChange={(k) => onValue(billOf(millions, hundreds, k, c))}
          size={30}
          padX={0}
          ink={ink}
          width={19}
          label={w.label('tens', 'onboarding.bills.tens')}
        />
        {w.place - 2 > 0 ? <Text style={number}>{zerosBelow(w.place - 2, w.mark)}</Text> : null}
        <WheelSymbol symbol={w.after} size={15} offset={48} ink={ink} side="after" />
      </View>
    </View>
  );
}
