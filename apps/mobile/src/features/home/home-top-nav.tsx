import { memo } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { lineUsed, type DailyNumber } from '@6pm/domain';

import { useMoneySelector } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { AmountText } from '../quick-add/amount-text';
import { shortParts } from '../quick-add/typed-amount';
import { PLAN_SECTIONS } from '../plan/plan-page';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, tabular } from '../../ui/type/fonts';
import type { HomeTab } from './home-tabs';
import { TopNav } from './top-nav';

/**
 * What the compact bar shows: on Today, a mini hero (the number, how much is used) with the
 * meter as a 3 pt line; on Plan and Diary, the page title and its context line.
 */
export const HomeTopNav = memo(function HomeTopNav({
  tab,
  day,
  onPressTop,
  onQuickAdd,
  planSection,
  onPlanSection,
}: {
  readonly tab: HomeTab;
  readonly day: DailyNumber;
  readonly onPressTop: () => void;
  readonly onQuickAdd: () => void;
  readonly planSection: number;
  readonly onPlanSection: (index: number) => void;
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const money = useMoneyFormat();
  const { dayDate } = useClock();
  const daysLeft = useMoneySelector((snapshot) => snapshot.cycle.daysLeft);
  const used = day.safe < 0 ? 1 : lineUsed(day);
  const meter = useAnimatedStyle(() => ({ width: `${used * 100}%` }));
  const meterTrack = palette.dark ? 'rgba(255,255,255,.2)' : 'rgba(27,30,46,.12)';
  const warn = palette.dark ? '#ffbe8a' : '#b8622a';

  if (tab === 'today') {
    return (
      <TopNav onPressTop={onPressTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text style={{ ...body(12, 600), color: palette.inkSoft }}>
              {t('today.safeToSpend')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <AmountText
                parts={shortParts(Math.max(0, day.safe), money)}
                style={{ ...leading(display(27, 500, -0.02), 27, true), color: palette.ink }}
              />
              <Text
                numberOfLines={1}
                style={{ ...body(12.5), ...tabular, color: palette.inkSoft, flexShrink: 1 }}
              >
                {t('today.meterUsed', {
                  spent: money.short(day.spent),
                  line: money.short(day.line),
                })}
              </Text>
            </View>
          </View>
          <PressScale
            onPress={onQuickAdd}
            accessibilityRole="button"
            accessibilityLabel={t('home.quickAdd')}
            hitSlop={4}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: palette.glass,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="add" size={22} color={palette.ink} />
          </PressScale>
        </View>
        <View
          style={{ height: 3, borderRadius: 3, backgroundColor: meterTrack, overflow: 'hidden' }}
        >
          <Animated.View
            style={[
              { height: 3, borderRadius: 3, backgroundColor: day.safe < 0 ? warn : palette.ink },
              meter,
            ]}
          />
        </View>
      </TopNav>
    );
  }

  const month = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(dayDate);
  return (
    <TopNav onPressTop={onPressTop}>
      <View style={{ alignItems: 'center', justifyContent: 'center', gap: 1, minHeight: 40 }}>
        <Text style={{ ...body(17, 650, -0.01), color: palette.ink }}>
          {t(tab === 'plan' ? 'tabs.plan' : 'tabs.diary')}
        </Text>
        <Text style={{ ...body(12), color: palette.inkSoft }}>
          {tab === 'plan' ? t('plan.daysToPayday', { count: daysLeft }) : month}
        </Text>
      </View>
      {tab === 'plan' ? (
        <View
          accessibilityRole="tablist"
          style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}
        >
          {PLAN_SECTIONS.map((section, k) => {
            const on = k === planSection;
            return (
              <PressScale
                key={section}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                hitSlop={{ top: 7, bottom: 7 }}
                onPress={() => {
                  if (!on) haptics.tick();
                  onPlanSection(k);
                }}
                style={{
                  height: 30,
                  paddingHorizontal: 12,
                  borderRadius: 99,
                  backgroundColor: on ? palette.btnBg : palette.chipBg,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...body(13, 600), color: on ? palette.btnFg : palette.ink }}>
                  {t(section === 'overview' ? 'plan.section.overview' : `plan.river.${section}`)}
                </Text>
              </PressScale>
            );
          })}
        </View>
      ) : null}
    </TopNav>
  );
});
