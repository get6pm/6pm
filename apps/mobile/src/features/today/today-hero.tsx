import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { formatShort, lineUsed, type DailyNumber } from '@6pm/domain';
import { curves } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { useHomeNav } from '../home/home-nav';
import { TravelPill } from '../travel/travel-pill';
import { Symbol } from '../../ui/icons/symbol';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { Odometer } from '../../ui/odometer';
import { GlassButton } from '../../ui/primitives/glass-button';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';

const meterEase = Easing.bezier(...curves.enter);

/**
 * The top of Today: the date, the two glass buttons, and the one number with its meter. Measures
 * follow the prototype (`App:125-158`): a 400 pt band, 60/22/40 padding, a 92 pt display number.
 */
export function TodayHero({
  day,
  onSettings,
  onQuickAdd,
}: {
  readonly day: DailyNumber;
  readonly onSettings: () => void;
  readonly onQuickAdd: () => void;
}) {
  const { palette } = useTheme();
  const { dayDate } = useClock();
  const { t, weekday, dayMonth, language } = useI18n();
  const { goToTab } = useHomeNav();
  const { top } = useDesignInsets();

  const over = day.safe < 0;
  const warn = palette.dark ? '#ffbe8a' : '#b8622a';
  const meterColor = over ? warn : palette.ink;
  const meterTrack = palette.dark ? 'rgba(255,255,255,.2)' : 'rgba(27,30,46,.12)';
  const pct = over ? 1 : lineUsed(day);
  const fill = useAnimatedStyle(() => ({
    width: withTiming(`${pct * 100}%`, { duration: 800, easing: meterEase }),
  }));

  const left = over
    ? t('today.meterOver', { over: formatShort(-day.safe, language) })
    : day.spent
      ? t('today.meterUsed', {
          spent: formatShort(day.spent, language),
          line: formatShort(day.line, language),
        })
      : t('today.meterNothing');
  const right = t('today.tomorrowAbout', { amount: formatShort(day.tomorrow, language) });

  return (
    <View
      style={{
        height: top(400),
        paddingTop: top(60),
        paddingHorizontal: 22,
        paddingBottom: 40,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 1 }}>
          <Text
            style={{
              ...body(13, 600, 0.06),
              textTransform: 'uppercase',
              color: palette.inkSoft,
            }}
          >
            {weekday(dayDate)}
          </Text>
          <Text style={{ ...body(22, 700, -0.02), color: palette.ink }}>{dayMonth(dayDate)}</Text>
          <TravelPill />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <GlassButton icon="tune" label={t('home.settings')} onPress={onSettings} />
          <GlassButton icon="add" iconSize={26} label={t('home.quickAdd')} onPress={onQuickAdd} />
        </View>
      </View>

      {/* The number opens the plan behind it, as in the prototype (`toPlan`). */}
      <PressScale
        scaleTo={0.98}
        inScroll
        onPress={() => goToTab('plan')}
        accessibilityRole="button"
        accessibilityHint={t('home.openPlan')}
        style={{ gap: 6 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ ...body(15, 500), color: palette.inkSoft }}>{t('today.safeToSpend')}</Text>
          <Symbol name="info" size={18} color={palette.inkSoft} style={{ opacity: 0.6 }} />
        </View>
        <View style={{ marginLeft: -3 }}>
          <Odometer
            value={Math.max(0, day.safe)}
            size={92}
            letterSpacingEm={-0.02}
            color={palette.ink}
          />
        </View>
        <View style={{ gap: 8, paddingTop: 10, maxWidth: 262 }}>
          <View
            style={{ height: 6, borderRadius: 6, backgroundColor: meterTrack, overflow: 'hidden' }}
          >
            <Animated.View
              style={[{ height: 6, borderRadius: 6, backgroundColor: meterColor }, fill]}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ ...body(13.5, 500), ...tabular, color: palette.inkSoft }}>{left}</Text>
            <Text style={{ ...body(13.5, 500), ...tabular, color: palette.inkSoft }}>{right}</Text>
          </View>
        </View>
      </PressScale>
    </View>
  );
}
