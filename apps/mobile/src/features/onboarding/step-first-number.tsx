import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { Companion } from '../../ui/companion/companion';
import { haptics } from '../../ui/haptics';
import { FitWidth } from '../../ui/layout/fit-width';
import { Odometer } from '../../ui/odometer';
import { body, display, leading } from '../../ui/type/fonts';
import type { FirstDay } from './onboarding-maths';
import {
  ease,
  fadeEntering,
  popEntering,
  riseEntering,
  useMountProgress,
} from './onboarding-motion';
import { leaveGradient, type OnboardingPalette } from './onboarding-palette';
import { FutureYouAtPayday, SincePaydayEditor, SincePaydayLine } from './since-payday';

/** The number waits for the companion to land before it rolls in. */
const ROLL_AFTER_MS = 900;
/** The odometer's longest column settles about here. */
const SETTLED_MS = 2000;
/** Everything on the step glides to its new place when the wheels open or close. */
const reflow = LinearTransition.duration(300).easing(ease.enter);

function SplitBar({ flex, color }: { readonly flex: number; readonly color: string }) {
  const grow = useMountProgress(800, ease.enter, 1200);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }] }));
  return (
    <Animated.View style={[{ flex, backgroundColor: color, transformOrigin: 'left' }, style]} />
  );
}

/**
 * The first number: today's safe-to-spend from the domain engine rolls in, with how the month
 * splits into bills, Future you and spending money. Joining part-way through a pay cycle, one line
 * under it says what went since payday; tapping it opens the money wheels in the split's place,
 * and the number rolls to each new answer.
 */
export function StepFirstNumber({
  pal,
  income,
  bills,
  futureYou,
  first,
  closeAt,
  reminded,
  leaving,
  onSpentSincePayday,
  onFutureYouAtPayday,
}: {
  readonly pal: OnboardingPalette;
  readonly income: number;
  readonly bills: number;
  readonly futureYou: number;
  readonly first: FirstDay;
  readonly closeAt: string;
  /** False when the reminder was declined. */
  readonly reminded: boolean;
  readonly leaving: boolean;
  readonly onSpentSincePayday: (amount: number) => void;
  readonly onFutureYouAtPayday: (on: boolean) => void;
}) {
  const { t } = useI18n();
  const money = useMoneyFormat();
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const [editing, setEditing] = useState(false);
  const rolled = useRef(false);
  useEffect(() => {
    // After the first roll, a new answer rolls the number straight away, without the fanfare.
    if (rolled.current) {
      setShown(first.line);
      return;
    }
    const roll = setTimeout(() => {
      rolled.current = true;
      setShown(first.line);
    }, ROLL_AFTER_MS);
    const settle = setTimeout(haptics.success, SETTLED_MS);
    return () => {
      clearTimeout(roll);
      clearTimeout(settle);
    };
  }, [first.line]);

  const shrink = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(leaving && !reduceMotion ? -40 : 0, {
          duration: 600,
          easing: ease.enter,
        }),
      },
      {
        scale: withTiming(leaving && !reduceMotion ? 0.7 : 1, {
          duration: 600,
          easing: ease.enter,
        }),
      },
    ],
  }));

  const split = [
    { label: t('onboarding.reveal.bills'), value: bills, color: pal.bills },
    {
      label: t('onboarding.reveal.future'),
      value: first.futureYouSkipped ? 0 : futureYou,
      color: pal.green,
    },
    { label: t('onboarding.reveal.spend'), value: first.free, color: pal.accent },
  ];

  return (
    <Animated.View
      entering={fadeEntering(800, 0, reduceMotion)}
      style={{ flex: 1, alignItems: 'center', gap: 10 }}
    >
      <Animated.View layout={reflow} style={{ flex: 0.6 }} />
      <Animated.View
        layout={reflow}
        style={{ alignSelf: 'stretch', alignItems: 'center', gap: 10 }}
      >
        <Animated.View entering={popEntering(800, 200, reduceMotion, ease.popIn)}>
          <Companion size={120} mood="happy" />
        </Animated.View>
        <Text style={{ ...body(16, 600), color: pal.inkSoft }}>
          {t('onboarding.reveal.kicker')}
        </Text>
        <Animated.View style={[{ alignSelf: 'stretch', paddingHorizontal: 20 }, shrink]}>
          <FitWidth height={Math.round(84 * 1.04)} align="center">
            <Odometer
              value={shown}
              size={84}
              weight={600}
              letterSpacingEm={-0.04}
              color={pal.ink}
            />
          </FitWidth>
        </Animated.View>
      </Animated.View>
      {first.joined ? (
        <Animated.View layout={reflow}>
          <SincePaydayLine
            pal={pal}
            since={first.since}
            amount={first.spentSincePayday}
            open={editing}
            onOpen={setEditing}
          />
        </Animated.View>
      ) : null}
      {first.offerFutureYouAtPayday ? (
        <Animated.View layout={reflow} style={{ alignSelf: 'stretch' }}>
          <FutureYouAtPayday
            pal={pal}
            payday={first.payday}
            on={first.futureYouSkipped}
            onChange={onFutureYouAtPayday}
          />
        </Animated.View>
      ) : null}
      {editing ? null : (
        <Animated.View layout={reflow}>
          <Text
            style={{
              ...leading(display(21, 500), 25.2),
              maxWidth: 300,
              textAlign: 'center',
              color: pal.ink,
            }}
          >
            {reminded
              ? t('onboarding.reveal.seeYou', { time: closeAt })
              : t('onboarding.reveal.noReminder', { time: closeAt })}
          </Text>
        </Animated.View>
      )}
      {editing ? (
        <SincePaydayEditor
          pal={pal}
          amount={first.spentSincePayday}
          onAmount={onSpentSincePayday}
          onDone={() => setEditing(false)}
        />
      ) : (
        <Animated.View
          layout={reflow}
          entering={riseEntering(500, 1000, reduceMotion)}
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
          <View
            style={{
              flexDirection: 'row',
              height: 14,
              gap: 3,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {split.map((part) => (
              <SplitBar key={part.label} flex={Math.max(part.value, 1)} color={part.color} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            {split.map((part) => (
              <View key={part.label} style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: part.color }}
                  />
                  <Text style={{ ...body(12), color: pal.inkSoft }}>{part.label}</Text>
                </View>
                <Text style={{ ...body(15, 700), color: pal.ink }}>
                  {money.short(Math.max(0, part.value))}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ ...body(12.5), lineHeight: 17.5, color: pal.inkSoft }}>
            {t('onboarding.reveal.math', {
              income: money.short(income),
              count: first.days,
            })}
          </Text>
        </Animated.View>
      )}
      <Animated.View layout={reflow} style={{ flex: 1 }} />
    </Animated.View>
  );
}

/** "Open 6pm": the sky closes over the screen with today's number, then Home takes its place. */
export function LeavingOverlay({
  step,
  line,
  pal,
}: {
  readonly step: number;
  readonly line: number;
  readonly pal: OnboardingPalette;
}) {
  const { t } = useI18n();
  const money = useMoneyFormat();
  const reduceMotion = useReducedMotion();
  const fade = useMountProgress(600, ease.cssIn);
  const style = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          inset: 0,
          zIndex: 9,
          experimental_backgroundImage: leaveGradient(step),
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        },
        style,
      ]}
    >
      <Text style={{ ...body(14, 600), opacity: 0.7, color: pal.light }}>
        {t('onboarding.leave.kicker')}
      </Text>
      <Animated.View entering={riseEntering(500, 100, reduceMotion)}>
        <Text style={{ ...display(56, 500, -0.03), color: pal.light }}>{money.short(line)}</Text>
      </Animated.View>
    </Animated.View>
  );
}
