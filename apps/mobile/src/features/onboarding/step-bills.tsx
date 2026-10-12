import { Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { formatShort } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { Odometer } from '../../ui/odometer';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { billName } from './bill-copy';
import { billTotal, type BillAnswers, type ChosenBill, type DeckItem } from './bill-deck';
import { BillDeckView, type DeckNav } from './bill-deck-view';
import { popEntering } from './onboarding-motion';
import { tileOf, type OnboardingPalette } from './onboarding-palette';
import { Card, StepHeading } from './step-parts';

function TrayChip({
  bill,
  pal,
  onPress,
}: {
  readonly bill: ChosenBill;
  readonly pal: OnboardingPalette;
  readonly onPress: () => void;
}) {
  const i18n = useI18n();
  const reduceMotion = useReducedMotion();
  const tile = tileOf(bill.hue);
  return (
    <Animated.View entering={popEntering(350, 0, reduceMotion)}>
      <PressScale
        onPress={onPress}
        accessibilityRole="button"
        style={{
          height: 30,
          paddingLeft: 6,
          paddingRight: 10,
          borderRadius: 99,
          backgroundColor: pal.chipBg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 7,
            experimental_backgroundImage: tile.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name={bill.icon} size={13} fill={1} color={tile.glyph} />
        </View>
        <Text style={{ ...body(12.5, 600), color: pal.ink }}>
          {billName(i18n, bill.card, bill.option)}
        </Text>
        <Text style={{ ...body(12.5, 600), color: pal.ink, opacity: 0.55 }}>
          {bill.amount
            ? formatShort(bill.amount, i18n.language)
            : i18n.t('onboarding.bills.amountLater')}
        </Text>
      </PressScale>
    </Animated.View>
  );
}

/** Fixed bills: the yes/no deck, then the running total with a chip per bill to revisit it. */
export function StepBills({
  pal,
  deck,
  bills,
  answers,
  nav,
  onAnswers,
  onGo,
}: {
  readonly pal: OnboardingPalette;
  readonly deck: readonly DeckItem[];
  readonly bills: readonly ChosenBill[];
  readonly answers: BillAnswers;
  readonly nav: DeckNav;
  readonly onAnswers: (next: BillAnswers) => void;
  readonly onGo: (index: number, direction: 1 | -1) => void;
}) {
  const { t, language } = useI18n();
  const total = billTotal(bills);
  const count = bills.length;
  const endTitle =
    count === 0
      ? t('onboarding.bills.endNone')
      : total > 0
        ? t('onboarding.bills.endTotal', { count, amount: formatShort(total, language) })
        : t('onboarding.bills.endCount', { count });
  return (
    <View style={{ flex: 1, gap: 14 }}>
      <StepHeading title={t('onboarding.bills.title')} sub={t('onboarding.bills.sub')} pal={pal} />
      <BillDeckView deck={deck} nav={nav} card={{ answers, pal, endTitle, onAnswers, onGo }} />
      <View style={{ flex: 1 }} />
      <Card pal={pal} radius={22} style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={{ ...body(14, 600), color: pal.inkSoft }}>
            {count ? t('onboarding.bills.trayCount', { count }) : t('onboarding.bills.trayNone')}
          </Text>
          <Odometer value={total} size={24} weight={600} letterSpacingEm={-0.02} color={pal.ink} />
        </View>
        {count > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {bills.map((bill) => (
              <TrayChip
                key={bill.key}
                bill={bill}
                pal={pal}
                onPress={() => onGo(bill.deckIndex, -1)}
              />
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}
