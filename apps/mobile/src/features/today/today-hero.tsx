import { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { lineUsed, type DailyNumber } from '@6pm/domain';
import { curves } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { useHomeNav } from '../home/home-nav';
import { TravelPill } from '../travel/travel-pill';
import { Symbol } from '../../ui/icons/symbol';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { FitWidth } from '../../ui/layout/fit-width';
import { Odometer } from '../../ui/odometer';
import { GlassButton } from '../../ui/primitives/glass-button';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import { pinnedOpticalSize, textShadows } from '../../ui/type/text-shadow';

const meterEase = Easing.bezier(...curves.enter);

/**
 * The top of Today: the date, the two glass buttons, and the one number with its meter. Measures
 * follow the prototype (`App:125-158`): a 400 pt band, 60/22/40 padding, a display number at the
 * look's hero size (92 pt, smaller for a wide face) with the look's glow.
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
  const heroSize = parseFloat(palette.heroSize) || 92;
  const heroGlows = useMemo(() => textShadows(palette.heroGlow), [palette.heroGlow]);
  const { dayDate } = useClock();
  const { t, weekday, dayMonth } = useI18n();
  const money = useMoneyFormat();
  const { goToTab } = useHomeNav();
  // On the iPhone Duo, Settings and Add live in the side rail.
  const { top, rail } = useDesignInsets();

  // A day over its line is covered by the days after it, unless the cycle's free money is gone:
  // then the meter says how far past the plan the cycle is, and only a spend today fills it.
  const cycleOver = day.overspent;
  const over = !cycleOver && day.safe < 0;
  const warn = palette.dark ? '#ffbe8a' : '#b8622a';
  const meterColor = over || (cycleOver && day.spent > 0) ? warn : palette.ink;
  const meterTrack = palette.dark ? 'rgba(255,255,255,.2)' : 'rgba(27,30,46,.12)';
  const pct = over ? 1 : lineUsed(day);
  const fill = useAnimatedStyle(() => ({
    width: withTiming(`${pct * 100}%`, { duration: 800, easing: meterEase }),
  }));

  const left = cycleOver
    ? t('today.meterPastPlan', { over: money.short(-day.free) })
    : over
      ? t('today.meterOver', { over: money.short(-day.safe) })
      : day.spent
        ? t('today.meterUsed', {
            spent: money.short(day.spent),
            line: money.short(day.line),
          })
        : t('today.meterNothing');
  const right = t('today.tomorrowAbout', { amount: money.short(day.tomorrow) });

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
        {rail > 0 ? null : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <GlassButton icon="tune" label={t('home.settings')} onPress={onSettings} />
            <GlassButton icon="add" iconSize={26} label={t('home.quickAdd')} onPress={onQuickAdd} />
          </View>
        )}
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
        {/* A long amount scales down to the width it has instead of running off the edge. */}
        <View style={{ marginLeft: -3 }}>
          <FitWidth height={Math.round(heroSize * 1.04)}>
            <Odometer
              value={Math.max(0, day.safe)}
              size={heroSize}
              glows={heroGlows}
              opsz={pinnedOpticalSize(palette.heroVar)}
              letterSpacingEm={-0.02}
              color={palette.ink}
            />
          </FitWidth>
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
