import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  addMonthsTo,
  clampNeededBy,
  latestNeededBy,
  NEEDED_BY_SPANS,
  neededByFromOffset,
  neededByHorizon,
  neededByStep,
} from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { NeededByTimeline } from './needed-by-timeline';
import type { PlanFormat } from './plan-format';
import { potSheetColours } from './pot-sheet-colours';

/** "3 months", "1 year", "2 years 3 months". */
export function useSpan() {
  const { t } = useI18n();
  return (total: number) => {
    const years = Math.floor(total / 12);
    const months = total % 12;
    const y = t('plan.pot.span.years', { count: years });
    const m = t('plan.pot.span.months', { count: months });
    if (years === 0) return m;
    if (months === 0) return y;
    return t('plan.pot.span.both', { years: y, months: m });
  };
}

/** One part of the span switch: the white pill fades in under the picked one. */
function Segment({
  label,
  on,
  grow,
  onPress,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly grow: number;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const lit = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    lit.value = withTiming(on ? 1 : 0, { duration: reduceMotion ? 0 : 200, easing: easeOut });
  }, [on, lit, reduceMotion]);
  const pill = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={{ flex: grow, height: 32, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            inset: 0,
            borderRadius: 10,
            backgroundColor: palette.cell,
            boxShadow: '0 1px 3px rgba(70,45,30,.15)',
          },
          pill,
        ]}
      />
      <Text numberOfLines={1} style={{ ...body(13, on ? 650 : 550), color: palette.ink }}>
        {label}
      </Text>
    </PressScale>
  );
}

function StepButton({
  icon,
  label,
  dim,
  onPress,
}: {
  readonly icon: 'chevron_left' | 'chevron_right';
  readonly label: string;
  readonly dim: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: dim }}
      disabled={dim}
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.chipBg,
        opacity: dim ? 0.35 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={icon} size={22} color={palette.ink} />
    </PressScale>
  );
}

/**
 * "Needed by", opened: the month with ‹ › to move one month, a ten-year line to drag along (green
 * where the plan fits), and 1, 2, 5 or 10 years or no date. With no date the line rests, faded, on
 * the pay cycle's month; moving it sets the date.
 */
export function NeededByEditor({
  month,
  from,
  format,
  hue,
  fitsFrom,
  onChange,
}: {
  readonly month: string | null;
  /** The pay cycle's month: the earliest a pot can be needed by. */
  readonly from: string;
  readonly format: PlanFormat;
  /** The pot's hue, for the line's green. */
  readonly hue: number;
  /** The first month that fits the plan; null when none does; undefined when not measured. */
  readonly fitsFrom?: string | null | undefined;
  readonly onChange: (month: string | null) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const span = useSpan();
  const colours = potSheetColours(palette, hue);
  const shown = clampNeededBy(month ?? from, from);
  const horizon = neededByHorizon(from, shown);
  const total = horizon.years * 12 + horizon.months;

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(140)}
      style={{ paddingHorizontal: 14, paddingBottom: 16, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <StepButton
          icon="chevron_left"
          label={t('plan.pot.monthBefore')}
          dim={month !== null && shown <= from}
          onPress={() => onChange(month === null ? from : neededByStep(shown, from, -1))}
        />
        <View style={{ flex: 1, alignItems: 'center', gap: 2, opacity: month === null ? 0.4 : 1 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ ...leading(display(32, 500, -0.02), 34, true), color: palette.ink }}
          >
            {format.monthLong(shown)}
          </Text>
          <Text style={{ ...body(13), color: palette.inkSoft }}>
            {total === 0 ? t('plan.pot.horizonNow') : t('plan.pot.horizon', { span: span(total) })}
          </Text>
        </View>
        <StepButton
          icon="chevron_right"
          label={t('plan.pot.monthAfter')}
          dim={month !== null && shown >= latestNeededBy(from)}
          onPress={() => onChange(month === null ? from : neededByStep(shown, from, 1))}
        />
      </View>
      <NeededByTimeline
        from={from}
        month={month}
        fitsFrom={fitsFrom}
        colours={colours}
        label={t('plan.pot.timeline')}
        onChange={(offset) => onChange(neededByFromOffset(from, offset))}
      />
      <View
        style={{
          flexDirection: 'row',
          padding: 3,
          gap: 3,
          borderRadius: 13,
          backgroundColor: palette.chipBg,
        }}
      >
        {NEEDED_BY_SPANS.map((ahead) => {
          const at = addMonthsTo(from, ahead);
          return (
            <Segment
              key={ahead}
              label={t('plan.pot.spanShort', { count: ahead / 12 })}
              on={at === month}
              grow={1}
              onPress={() => onChange(at)}
            />
          );
        })}
        <Segment
          label={t('plan.pot.noDate')}
          on={month === null}
          grow={1.2}
          onPress={() => onChange(null)}
        />
      </View>
    </Animated.View>
  );
}
