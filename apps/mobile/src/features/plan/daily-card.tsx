import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { dayBarFraction, dayBarScale, whatIfDaily, type DailyNumberInput } from '@6pm/domain';
import { curves } from '@6pm/theme';

import { usePlanActions } from '../../data/plan-actions';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { useRunAction } from '../companion/use-run-action';
import { haptics } from '../../ui/haptics';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, mono, tabular } from '../../ui/type/fonts';
import type { PlanColours } from './plan-colours';
import type { PlanFormat } from './plan-format';
import { PlanCard } from './plan-parts';
import { barDays, sliderMax, whatIfStep } from './plan-view';
import { WhatIfSlider } from './what-if-slider';

const enter = Easing.bezier(...curves.enter);
const BAR_MS = 450;
const ROW = 44;
/** The narrowest "a day · N days left" gets beside a long daily number. */
const LABEL_MIN = 96;

function DayBar({ fraction, colour }: { readonly fraction: number; readonly colour: string }) {
  const reduceMotion = useReducedMotion();
  const h = useSharedValue(fraction * ROW);
  useEffect(() => {
    h.value = withTiming(fraction * ROW, { duration: reduceMotion ? 0 : BAR_MS, easing: enter });
  }, [fraction, h, reduceMotion]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[{ flex: 1, borderRadius: 3, backgroundColor: colour }, style]} />;
}

/**
 * The daily number until payday, a bar for each day left (today in the accent, weekends warm)
 * and the what-if slider for Future you. Dragging shows the real daily number at every step;
 * letting go commits the new amount, which moves every number on the page.
 */
export function DailyCard({
  input,
  today,
  payday,
  daysLeft,
  committed,
  active,
  colours,
  format,
}: {
  /** What the committed daily number is worked out from; the preview changes only Future you. */
  readonly input: DailyNumberInput;
  readonly today: string;
  readonly payday: string;
  readonly daysLeft: number;
  /** Future you's monthly amount in the plan. */
  readonly committed: number;
  /** Whether the Plan tab is the one on show: each time it is shown the note starts afresh. */
  readonly active: boolean;
  readonly colours: PlanColours;
  readonly format: PlanFormat;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const actions = usePlanActions();
  const run = useRunAction();
  const [candidate, setCandidate] = useState(committed);
  // The note compares against the amount the tab was shown with, so the trade-off stays readable
  // after the new amount is committed, and starts afresh the next time the tab is shown.
  const [baseline, setBaseline] = useState(committed);
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) setBaseline(committed);
    wasActive.current = active;
  }, [active, committed]);
  useEffect(() => setCandidate(committed), [committed]);

  const daily = whatIfDaily(input, candidate);
  const change = daily - whatIfDaily(input, baseline);
  const scale = dayBarScale(input);
  const fraction = dayBarFraction(daily, scale);
  const delta = baseline - candidate;
  const note =
    delta === 0
      ? t('plan.whatIf.same')
      : delta > 0
        ? t('plan.whatIf.less', {
            amount: money.short(delta),
            daily: money.short(change),
          })
        : t('plan.whatIf.more', {
            amount: money.short(-delta),
            daily: money.short(-change),
          });

  return (
    <PlanCard padding={{ top: 18, side: 18, bottom: 18 }} gap={14}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        {/* A long amount shrinks to its room on one line. The label gives way first, down to its
            minimum (wrapping as it always has), and only then does the number shrink. */}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            ...leading(display(64 * palette.numK, 500, -0.03), 64, true),
            ...tabular,
            color: palette.ink,
            flexShrink: 0.01,
          }}
        >
          {money.short(daily)}
        </Text>
        <Text style={{ ...body(15), color: palette.inkSoft, flexShrink: 1, minWidth: LABEL_MIN }}>
          {t('plan.daily.perDay', { count: daysLeft })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, height: ROW, alignItems: 'flex-end' }}>
        {barDays(today, payday).map((d) => (
          <DayBar
            key={d.day}
            fraction={fraction}
            colour={d.isToday ? colours.barToday : d.weekend ? colours.barWeekend : colours.barDay}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 }}>
        {[format.weekdayDay(today), t('plan.daily.payday', { day: format.dayNumber(payday) })].map(
          (label) => (
            <Text
              key={label}
              style={{
                ...mono(10.5, 400, 0.08),
                textTransform: 'uppercase',
                color: palette.inkSoft,
              }}
            >
              {label}
            </Text>
          ),
        )}
      </View>
      <View style={{ borderTopWidth: 0.5, borderColor: palette.hair, marginVertical: 2 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ ...body(15, 600), color: palette.ink }}>{t('plan.whatIf.title')}</Text>
        <Text style={{ ...display(22, 500), ...tabular, color: palette.ink }}>
          {money.short(candidate)}
        </Text>
      </View>
      <WhatIfSlider
        value={candidate}
        max={sliderMax(committed, money.currency)}
        step={whatIfStep(money.currency)}
        colours={colours}
        label={t('plan.whatIf.title')}
        onStep={(v) => {
          haptics.tick();
          setCandidate(v);
        }}
        onCommit={(v) => {
          setCandidate(v);
          void run(() => actions.setFutureYou(v)).then((saved) => {
            if (!saved) setCandidate(committed);
          });
        }}
      />
      <Text style={{ ...body(13), lineHeight: 18.2, minHeight: 18, color: palette.inkSoft }}>
        {note}
      </Text>
    </PlanCard>
  );
}
