import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { FitWidth } from '../../ui/layout/fit-width';
import { body, display, leading } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { ease } from './onboarding-motion';
import { PERCENTS } from './onboarding-maths';
import type { OnboardingPalette } from './onboarding-palette';
import { Card, StepHeading, WheelBand } from './step-parts';

const RING = 200;
const HOLE = 168;
/** The amount keeps clear of the ring: it shrinks to the hole, less a little air. */
const FIT_PAD = (RING - HOLE) / 2 + 8;
/** The ring fills 2.5% of its turn per percent: 40% of money in closes it. */
const TURN_PER_PERCENT = 0.025;

/** The ring: a green slice of a full turn from twelve o'clock, easing to each new percentage. */
function SavingsRing({
  percent,
  pal,
}: {
  readonly percent: number;
  readonly pal: OnboardingPalette;
}) {
  const turn = useSharedValue(Math.min(1, percent * TURN_PER_PERCENT));
  useEffect(() => {
    turn.value = withTiming(Math.min(1, percent * TURN_PER_PERCENT), {
      duration: 300,
      easing: ease.css,
    });
  }, [percent, turn]);
  const slice = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const sweep = turn.value * 360;
    if (sweep <= 0) return path;
    if (sweep >= 360) {
      path.addCircle(RING / 2, RING / 2, RING / 2);
      return path;
    }
    path.moveTo(RING / 2, RING / 2);
    path.arcToOval(Skia.XYWHRect(0, 0, RING, RING), -90, sweep, false);
    path.close();
    return path;
  });
  return (
    <View
      style={{
        width: RING,
        height: RING,
        borderRadius: RING / 2,
        boxShadow: pal.cardShadow,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Canvas style={{ position: 'absolute', width: RING, height: RING }}>
        <Circle cx={RING / 2} cy={RING / 2} r={RING / 2} color={pal.ringTrack} />
        <Path path={slice} color={pal.green} />
      </Canvas>
      <View
        style={{
          width: HOLE,
          height: HOLE,
          borderRadius: HOLE / 2,
          backgroundColor: pal.cell,
        }}
      />
    </View>
  );
}

/** Pay future you first: a percentage wheel drives the ring and the amount set aside on payday. */
export function StepFutureYou({
  pal,
  percent,
  amount,
  free,
  onPercent,
}: {
  readonly pal: OnboardingPalette;
  readonly percent: number;
  /** Set aside each payday, in the home currency. */
  readonly amount: number;
  /** Money in less bills and this, for the month. */
  readonly free: number;
  readonly onPercent: (percent: number) => void;
}) {
  const { t, language } = useI18n();
  const money = useMoneyFormat();
  const month =
    language === 'vi'
      ? String(new Date().getMonth() + 1)
      : new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date());
  return (
    <View style={{ flex: 1, gap: 14 }}>
      <StepHeading
        title={t('onboarding.future.title')}
        sub={t('onboarding.future.sub')}
        pal={pal}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View>
          <SavingsRing percent={percent} pal={pal} />
          <View
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Text
              style={{
                ...body(12, 600, 0.05),
                textTransform: 'uppercase',
                color: pal.inkSoft,
              }}
            >
              {t('onboarding.future.each')}
            </Text>
            <View style={{ alignSelf: 'stretch', paddingHorizontal: FIT_PAD }}>
              <FitWidth height={44} align="center">
                <Text style={{ ...leading(display(44, 600, -0.03), 44), color: pal.ink }}>
                  {money.short(amount)}
                </Text>
              </FitWidth>
            </View>
            <Text style={{ ...body(12.5, 600), color: pal.inkSoft }}>
              {amount > 0
                ? t('onboarding.future.year', { amount: money.short(amount * 12), month })
                : t('onboarding.future.skip')}
            </Text>
          </View>
        </View>
      </View>
      <Card
        pal={pal}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Text style={{ ...body(16, 550), flex: 1, textAlign: 'right', color: pal.ink }}>
          {t('onboarding.future.setAside')}
        </Text>
        <View style={{ width: 84, justifyContent: 'center' }}>
          <WheelBand height={42} radius={13} color={pal.chipBg} />
          <Wheel
            items={PERCENTS}
            index={percent}
            onChange={onPercent}
            size={28}
            ink={pal.ink}
            width={84}
            label={t('onboarding.future.setAside')}
          />
        </View>
        <Text style={{ ...body(16, 550), flex: 1, color: pal.ink }}>
          {t('onboarding.future.ofIncome')}
        </Text>
      </Card>
      <Text style={{ ...body(13), lineHeight: 18.85, paddingHorizontal: 6, color: pal.inkSoft }}>
        {free > 0
          ? t('onboarding.future.note', { amount: money.short(free) })
          : t('onboarding.future.noteNone')}
      </Text>
    </View>
  );
}
