import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { addMonthsTo, NEEDED_BY_QUICK_PICKS, neededByAt, neededByYears } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { wheelRowHeight } from '../../ui/wheel/wheel-maths';
import type { PlanFormat } from './plan-format';

const SIZE = 24;
const MONTHS = Array.from({ length: 12 }, (_, k) => k);

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

function Chip({
  label,
  on,
  onPress,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={{
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 99,
        backgroundColor: on ? palette.btnBg : palette.chipBg,
        justifyContent: 'center',
      }}
    >
      <Text style={{ ...body(13, 650), color: on ? palette.btnFg : palette.ink }}>{label}</Text>
    </PressScale>
  );
}

/**
 * "Needed by", opened: quick picks from three months to five years and "No date", over a month and
 * a year wheel that reach any month up to ten years out. With no date the wheels rest, faded, on
 * the pay cycle's month; turning one sets the date.
 */
export function NeededByEditor({
  month,
  from,
  format,
  onChange,
}: {
  readonly month: string | null;
  /** The pay cycle's month: the earliest a pot can be needed by. */
  readonly from: string;
  readonly format: PlanFormat;
  readonly onChange: (month: string | null) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const span = useSpan();
  const years = neededByYears(from);
  const shown = month ?? from;
  const year = Number(shown.slice(0, 4));
  const monthIndex = Number(shown.slice(5, 7)) - 1;
  const yearIndex = Math.max(0, years.indexOf(year));
  const rowHeight = wheelRowHeight(SIZE);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(140)}
      style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {NEEDED_BY_QUICK_PICKS.map((ahead) => {
          const at = addMonthsTo(from, ahead);
          return (
            <Chip key={ahead} label={span(ahead)} on={at === month} onPress={() => onChange(at)} />
          );
        })}
        <Chip label={t('plan.pot.noDate')} on={month === null} onPress={() => onChange(null)} />
      </View>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: month === null ? 0.4 : 1,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: rowHeight + 6,
            marginTop: -(rowHeight + 6) / 2,
            borderRadius: 13,
            backgroundColor: palette.chipBg,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Wheel
            items={MONTHS.map((k) => format.monthOfYear(k))}
            index={monthIndex}
            onChange={(k) => onChange(neededByAt(year, k, from))}
            size={SIZE}
            rows={5}
            ink={palette.ink}
            width={128}
            label={t('plan.pot.monthWheel')}
          />
          <Wheel
            items={years.map(String)}
            index={yearIndex}
            onChange={(k) => onChange(neededByAt(years[k] ?? year, monthIndex, from))}
            size={SIZE}
            rows={5}
            ink={palette.ink}
            width={96}
            label={t('plan.pot.yearWheel')}
          />
        </View>
      </View>
    </Animated.View>
  );
}
