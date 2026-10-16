import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { parts, type LocalDate } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { IncomeWheels } from './money-in-controls';
import { riseEntering } from './onboarding-motion';
import type { OnboardingPalette } from './onboarding-palette';

/** A local day as the phone's date formatter reads it. */
export function dateOf(day: LocalDate): Date {
  const { year, month, day: d } = parts(day);
  return new Date(year, month - 1, d);
}

/**
 * "Since payday on 30 September, spent about 5tr": what the first number counts as gone before
 * 6pm started. Prefilled with the even-pace estimate; tapping it opens the money wheels.
 */
export function SincePaydayLine({
  pal,
  since,
  amount,
  open,
  onOpen,
}: {
  readonly pal: OnboardingPalette;
  readonly since: LocalDate;
  readonly amount: number;
  readonly open: boolean;
  readonly onOpen: (open: boolean) => void;
}) {
  const { t, dayMonth } = useI18n();
  const money = useMoneyFormat();
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={riseEntering(500, 900, reduceMotion)}>
      <PressScale
        scaleTo={0.96}
        accessibilityRole="button"
        accessibilityHint={t('onboarding.reveal.sincePaydayEdit')}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          haptics.tick();
          onOpen(!open);
        }}
        style={{
          minHeight: 32,
          paddingVertical: 6,
          paddingLeft: 14,
          paddingRight: 10,
          borderRadius: 99,
          backgroundColor: pal.chipBg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Text style={{ ...body(13.5, 600), color: pal.inkSoft, flexShrink: 1 }}>
          {t('onboarding.reveal.sincePayday', {
            date: dayMonth(dateOf(since)),
            amount: money.short(amount),
          })}
        </Text>
        <Symbol name={open ? 'check' : 'edit'} size={15} color={pal.ink} />
      </PressScale>
    </Animated.View>
  );
}

/** The wheels for "spent since payday", in the card the month's split otherwise fills. */
export function SincePaydayEditor({
  pal,
  amount,
  onAmount,
  onDone,
}: {
  readonly pal: OnboardingPalette;
  readonly amount: number;
  readonly onAmount: (amount: number) => void;
  readonly onDone: () => void;
}) {
  const { t } = useI18n();
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(140)}
      style={{
        alignSelf: 'stretch',
        marginTop: 12,
        borderRadius: 24,
        backgroundColor: pal.cell,
        boxShadow: pal.cardShadow,
        padding: 16,
        gap: 10,
      }}
    >
      <IncomeWheels income={amount} onIncome={onAmount} colours={pal} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ ...body(12.5), lineHeight: 17.5, color: pal.inkSoft, flex: 1 }}>
          {t('onboarding.reveal.sincePaydayHint')}
        </Text>
        <PressScale
          scaleTo={0.94}
          accessibilityRole="button"
          onPress={() => {
            haptics.tap();
            onDone();
          }}
          style={{
            height: 34,
            paddingHorizontal: 16,
            borderRadius: 99,
            backgroundColor: pal.btnBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(14, 650), color: pal.btnFg }}>
            {t('onboarding.reveal.sincePaydayDone')}
          </Text>
        </PressScale>
      </View>
    </Animated.View>
  );
}

/**
 * "Start Future you at payday", offered when the month the person joined is already spent: this
 * cycle sets nothing aside for Future you, so day one is not a zero; every later cycle is whole.
 */
export function FutureYouAtPayday({
  pal,
  payday,
  on,
  onChange,
}: {
  readonly pal: OnboardingPalette;
  readonly payday: LocalDate;
  readonly on: boolean;
  readonly onChange: (on: boolean) => void;
}) {
  const { t, dayMonth } = useI18n();
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(140)}>
      <PressScale
        scaleTo={0.97}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        onPress={() => onChange(!on)}
        style={{
          borderRadius: 18,
          backgroundColor: on ? pal.greenSoft : pal.chipBg,
          paddingVertical: 10,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Symbol
          name={on ? 'check_circle' : 'radio_button_unchecked'}
          size={22}
          fill={on ? 1 : 0}
          color={on ? pal.green : pal.inkSoft}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(14.5, 650), color: pal.ink }}>
            {t('onboarding.reveal.futureAtPayday')}
          </Text>
          <Text style={{ ...body(12.5), lineHeight: 17, color: pal.inkSoft }}>
            {t('onboarding.reveal.futureAtPaydayNote', { date: dayMonth(dateOf(payday)) })}
          </Text>
        </View>
      </PressScale>
    </Animated.View>
  );
}
