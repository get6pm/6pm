import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display, mono } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { BILL_CARDS, type DeckItem } from './bill-deck';
import { BILL_MILLIONS, billDigits, billOf, DIGITS } from './onboarding-maths';
import { tileOf, type OnboardingPalette } from './onboarding-palette';
import { WheelBand } from './step-parts';

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
}: {
  readonly q: string;
  readonly sub: string;
  readonly pal: OnboardingPalette;
}) {
  return (
    <>
      <BalancedText
        style={{ ...display(26, 600, -0.025), lineHeight: 27.3, paddingTop: 4, color: pal.ink }}
      >
        {q}
      </BalancedText>
      <Text style={{ ...body(13.5), lineHeight: 18.9, color: pal.inkSoft }}>{sub}</Text>
      <View style={{ flex: 1 }} />
    </>
  );
}

export function AmountWheels({
  value,
  pal,
  onValue,
}: {
  readonly value: number;
  readonly pal: OnboardingPalette;
  readonly onValue: (value: number) => void;
}) {
  const { t } = useI18n();
  const { millions, hundreds, tens } = billDigits(value);
  const number = { ...display(30, 600, -0.03), color: pal.ink };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <WheelBand height={44} radius={14} color={pal.chipBg} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Wheel
          items={BILL_MILLIONS}
          index={millions}
          onChange={(k) => onValue(billOf(k, hundreds, tens))}
          size={30}
          padX={0}
          align="flex-end"
          ink={pal.ink}
          width={54}
          label={t('onboarding.bills.millions')}
        />
        <Text style={number}>.</Text>
        <Wheel
          items={DIGITS}
          index={hundreds}
          onChange={(k) => onValue(billOf(millions, k, tens))}
          size={30}
          padX={0}
          ink={pal.ink}
          width={19}
          label={t('onboarding.bills.hundreds')}
        />
        <Wheel
          items={DIGITS}
          index={tens}
          onChange={(k) => onValue(billOf(millions, hundreds, k))}
          size={30}
          padX={0}
          ink={pal.ink}
          width={19}
          label={t('onboarding.bills.tens')}
        />
        <Text style={number}>0.000</Text>
        <Text
          style={{
            ...display(15, 600),
            color: pal.ink,
            marginLeft: 4,
            opacity: 0.55,
            alignSelf: 'flex-start',
            marginTop: 48,
          }}
        >
          ₫
        </Text>
      </View>
    </View>
  );
}
