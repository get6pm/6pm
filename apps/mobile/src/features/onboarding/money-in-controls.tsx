import { Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { Payday } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { DIGITS, INCOME_MILLIONS, incomeDigits, incomeOf } from './onboarding-maths';
import { ordinalDay, WheelBand } from './step-parts';

/** The colours these controls draw with: onboarding's sky palette, or a sheet's own. */
export interface PickerInk {
  readonly ink: string;
  readonly inkSoft: string;
  /** The soft band behind a wheel's chosen row, and the track of the payday switch. */
  readonly chipBg: string;
  /** The payday switch's chosen segment. */
  readonly segOn: string;
  readonly segShadow: string;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MODES = [
  ['sameDay', 'onboarding.payday.sameDay'],
  ['lastDay', 'onboarding.payday.lastDay'],
  ['varies', 'onboarding.payday.varies'],
] as const;

/** Money in: millions and hundred thousands on two wheels. */
export function IncomeWheels({
  income,
  onIncome,
  colours,
}: {
  readonly income: number;
  readonly onIncome: (income: number) => void;
  readonly colours: Pick<PickerInk, 'ink' | 'chipBg'>;
}) {
  const { t } = useI18n();
  const { millions, hundreds } = incomeDigits(income);
  const number = { ...display(38, 600, -0.03), color: colours.ink };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <WheelBand height={54} radius={16} color={colours.chipBg} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Wheel
          items={INCOME_MILLIONS}
          index={millions - 1}
          onChange={(k) => onIncome(incomeOf(k + 1, hundreds))}
          size={38}
          padX={0}
          align="flex-end"
          ink={colours.ink}
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
          ink={colours.ink}
          width={24}
          label={t('onboarding.income.hundreds')}
        />
        <Text style={number}>00.000</Text>
        <Text
          style={{
            ...display(19, 600),
            color: colours.ink,
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
  );
}

function Segment({
  label,
  on,
  colours,
  onPress,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly colours: PickerInk;
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
            backgroundColor: colours.segOn,
            boxShadow: colours.segShadow,
          },
          thumb,
        ]}
      />
      <Text style={{ ...body(13.5, 600), color: colours.ink }}>{label}</Text>
    </PressScale>
  );
}

/** A day of the month on a small wheel ("25th"), as the payday and a bill's due day are set. */
export function DayOfMonthWheel({
  day,
  onDay,
  label,
  colours,
}: {
  readonly day: number;
  readonly onDay: (day: number) => void;
  readonly label: string;
  readonly colours: Pick<PickerInk, 'ink' | 'chipBg'>;
}) {
  const i18n = useI18n();
  const items = DAYS.map((n) => ordinalDay(i18n, n));
  return (
    <View style={{ width: 76, justifyContent: 'center' }}>
      <WheelBand height={34} radius={11} color={colours.chipBg} />
      <Wheel
        items={items}
        index={Math.min(31, Math.max(1, day)) - 1}
        onChange={(k) => onDay(k + 1)}
        size={22}
        ink={colours.ink}
        width={76}
        label={label}
      />
    </View>
  );
}

/** When money lands: the same day each month, the last day, or "it varies". */
export function PaydayPicker({
  payday,
  sameDay,
  onPayday,
  colours,
}: {
  readonly payday: Payday;
  /** The day wheel's value, kept while another payday kind is chosen. */
  readonly sameDay: number;
  readonly onPayday: (payday: Payday) => void;
  readonly colours: PickerInk;
}) {
  const { t } = useI18n();
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          padding: 3,
          borderRadius: 12,
          backgroundColor: colours.chipBg,
        }}
      >
        {MODES.map(([kind, key]) => (
          <Segment
            key={kind}
            label={t(key)}
            on={payday.kind === kind}
            colours={colours}
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
          <Text style={{ ...body(16, 550), flex: 1, textAlign: 'right', color: colours.ink }}>
            {t('onboarding.payday.paidOn')}
          </Text>
          <DayOfMonthWheel
            day={payday.day}
            onDay={(day) => onPayday({ kind: 'sameDay', day })}
            label={t('onboarding.payday.title')}
            colours={colours}
          />
          <Text style={{ ...body(16, 550), flex: 1, color: colours.ink }}>
            {t('onboarding.payday.ofMonth')}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View
          key={payday.kind}
          entering={FadeIn.duration(300)}
          style={{ minHeight: 93, justifyContent: 'center' }}
        >
          <Text style={{ ...body(14), lineHeight: 20.3, color: colours.inkSoft }}>
            {payday.kind === 'lastDay'
              ? t('onboarding.payday.lastDayNote')
              : t('onboarding.payday.variesNote')}
          </Text>
        </Animated.View>
      )}
    </>
  );
}
