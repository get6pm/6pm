import { Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { formatShort, type Payday } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { DIGITS, INCOME_MILLIONS, incomeDigits, incomeOf } from './onboarding-maths';
import type { OnboardingPalette } from './onboarding-palette';
import { Card, ordinalDay, StepHeading, WheelBand } from './step-parts';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MODES = [
  ['sameDay', 'onboarding.payday.sameDay'],
  ['lastDay', 'onboarding.payday.lastDay'],
  ['varies', 'onboarding.payday.varies'],
] as const;

function Segment({
  label,
  on,
  pal,
  onPress,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly pal: OnboardingPalette;
  readonly onPress: () => void;
}) {
  const thumb = useAnimatedStyle(() => ({ opacity: withTiming(on ? 1 : 0, { duration: 200 }) }));
  return (
    <PressScale
      scaleTo={0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{ flex: 1, height: 34, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            inset: 0,
            borderRadius: 9,
            backgroundColor: pal.segOn,
            boxShadow: pal.segShadow,
          },
          thumb,
        ]}
      />
      <Text style={{ ...body(13.5, 600), color: pal.ink }}>{label}</Text>
    </PressScale>
  );
}

/** Money in: millions and hundred thousands on two wheels, then when it lands. */
export function StepMoneyIn({
  pal,
  income,
  payday,
  sameDay,
  dailyHint,
  onIncome,
  onPayday,
}: {
  readonly pal: OnboardingPalette;
  readonly income: number;
  readonly payday: Payday;
  /** The day wheel's value, kept while another payday kind is chosen. */
  readonly sameDay: number;
  /** Money in alone, spread over the days to payday by the domain engine. */
  readonly dailyHint: number;
  readonly onIncome: (income: number) => void;
  readonly onPayday: (payday: Payday) => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const { millions, hundreds } = incomeDigits(income);
  const dayItems = DAYS.map((n) => ordinalDay(i18n, n));
  const number = { ...display(38, 600, -0.03), color: pal.ink };

  return (
    <View style={{ gap: 14 }}>
      <StepHeading
        title={t('onboarding.income.title')}
        sub={t('onboarding.income.sub')}
        pal={pal}
      />
      <Card pal={pal} style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 14, gap: 6 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <WheelBand height={54} radius={16} color={pal.chipBg} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Wheel
              items={INCOME_MILLIONS}
              index={millions - 1}
              onChange={(k) => onIncome(incomeOf(k + 1, hundreds))}
              size={38}
              padX={0}
              align="flex-end"
              ink={pal.ink}
              width={72}
              label={t('onboarding.income.millions')}
            />
            <Text style={number}>.</Text>
            <Wheel
              items={DIGITS}
              index={hundreds}
              onChange={(k) => onIncome(incomeOf(millions, k))}
              size={38}
              padX={0}
              ink={pal.ink}
              width={24}
              label={t('onboarding.income.hundreds')}
            />
            <Text style={number}>00.000</Text>
            <Text
              style={{
                ...display(19, 600),
                color: pal.ink,
                marginLeft: 4,
                opacity: 0.55,
                alignSelf: 'flex-start',
                marginTop: 58,
              }}
            >
              ₫
            </Text>
          </View>
        </View>
        <Text style={{ ...body(13), textAlign: 'center', color: pal.inkSoft }}>
          {t('onboarding.income.daily', { amount: formatShort(dailyHint) })}
        </Text>
      </Card>
      <Card pal={pal} style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
        <Text style={{ ...body(15, 650), color: pal.ink }}>{t('onboarding.payday.title')}</Text>
        <View
          style={{
            flexDirection: 'row',
            padding: 3,
            borderRadius: 12,
            backgroundColor: pal.chipBg,
          }}
        >
          {MODES.map(([kind, key]) => (
            <Segment
              key={kind}
              label={t(key)}
              on={payday.kind === kind}
              pal={pal}
              onPress={() => onPayday(kind === 'sameDay' ? { kind, day: sameDay } : { kind })}
            />
          ))}
        </View>
        {payday.kind === 'sameDay' ? (
          <Animated.View
            key="sameDay"
            entering={FadeIn.duration(300)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Text style={{ ...body(16, 550), flex: 1, textAlign: 'right', color: pal.ink }}>
              {t('onboarding.payday.paidOn')}
            </Text>
            <View style={{ width: 76, justifyContent: 'center' }}>
              <WheelBand height={34} radius={11} color={pal.chipBg} />
              <Wheel
                items={dayItems}
                index={payday.day - 1}
                onChange={(k) => onPayday({ kind: 'sameDay', day: k + 1 })}
                size={22}
                ink={pal.ink}
                width={76}
                label={t('onboarding.payday.title')}
              />
            </View>
            <Text style={{ ...body(16, 550), flex: 1, color: pal.ink }}>
              {t('onboarding.payday.ofMonth')}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            key={payday.kind}
            entering={FadeIn.duration(300)}
            style={{ minHeight: 93, justifyContent: 'center' }}
          >
            <Text style={{ ...body(14), lineHeight: 20.3, color: pal.inkSoft }}>
              {payday.kind === 'lastDay'
                ? t('onboarding.payday.lastDayNote')
                : t('onboarding.payday.variesNote')}
            </Text>
          </Animated.View>
        )}
      </Card>
    </View>
  );
}
