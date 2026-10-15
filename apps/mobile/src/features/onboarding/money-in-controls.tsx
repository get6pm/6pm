import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { Payday } from '@6pm/domain';
import { curves, durations } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import {
  DIGITS,
  INCOME_LEADS,
  incomeDigits,
  incomeMillionsItems,
  incomeOf,
} from './onboarding-maths';
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

/** Money in's type size: three wheels and the zeros fit a sheet's card at this size. */
const SIZE = 34;
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MODES = [
  ['sameDay', 'onboarding.payday.sameDay'],
  ['lastDay', 'onboarding.payday.lastDay'],
  ['varies', 'onboarding.payday.varies'],
] as const;

/** The hundreds-of-millions wheel's width once it has come in. */
const LEAD_WIDTH = 52;
/** Millions from which the hundreds-of-millions wheel comes in: 90.000.000₫ and up. */
const LEAD_FROM = 90;
const LEAD_MOVE = { duration: durations.sheet, easing: Easing.bezier(...curves.enter) };

/**
 * Money in on wheels read as the amount itself: millions and hundred thousands, and, once the
 * millions reach 90, a hundreds-of-millions wheel that slides in on their left, up to
 * 1.000.000.000₫ a month. It stays while it holds a digit.
 */
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
  const { lead, millions, hundreds } = incomeDigits(income);
  const number = { ...display(SIZE, 600, -0.03), color: colours.ink };
  const leadShown = lead > 0 || millions >= LEAD_FROM;
  const leadStyle = useAnimatedStyle(() => ({
    width: withTiming(leadShown ? LEAD_WIDTH : 0, LEAD_MOVE),
    opacity: withTiming(leadShown ? 1 : 0, LEAD_MOVE),
  }));
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <WheelBand height={48} radius={15} color={colours.chipBg} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View
          pointerEvents={leadShown ? 'auto' : 'none'}
          style={[{ overflow: 'hidden', alignItems: 'flex-end' }, leadStyle]}
        >
          <Wheel
            items={INCOME_LEADS}
            index={lead}
            onChange={(k) => onIncome(incomeOf(k, millions, hundreds))}
            size={SIZE}
            padX={0}
            align="flex-end"
            ink={colours.ink}
            width={LEAD_WIDTH}
            label={t('onboarding.income.hundredMillions')}
          />
        </Animated.View>
        <Wheel
          items={incomeMillionsItems(lead)}
          index={millions}
          onChange={(k) => onIncome(incomeOf(lead, k, hundreds))}
          size={SIZE}
          padX={0}
          align={lead > 0 ? 'flex-start' : 'flex-end'}
          ink={colours.ink}
          width={44}
          label={t('onboarding.income.millions')}
        />
        <Text style={number}>.</Text>
        <Wheel
          items={DIGITS}
          index={hundreds}
          onChange={(k) => onIncome(incomeOf(lead, millions, k))}
          size={SIZE}
          padX={0}
          ink={colours.ink}
          width={22}
          label={t('onboarding.income.hundreds')}
        />
        <Text style={number}>00.000</Text>
        <Text
          style={{
            ...display(18, 600),
            color: colours.ink,
            marginLeft: 4,
            opacity: 0.55,
            alignSelf: 'flex-start',
            marginTop: 52,
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
