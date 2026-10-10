import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type AnimatedRef } from 'react-native-reanimated';

import type { DailyNumber } from '@6pm/domain';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { useHomePageScroll, useHomeScroll } from '../home/home-scroll';
import { CompanionGreeting } from './companion-greeting';
import { TodayHero } from './today-hero';
import { TodayList } from './today-list';
import { todayView } from './today-view';
import { useSpendLabels } from './use-spend-rows';
import { TonightCard } from './tonight-card';

/**
 * Today: the hero over the sky, then the sheet that holds the companion, tonight's card, the week
 * and the list. As the page scrolls the hero drifts at half speed, shrinks a touch toward its
 * bottom edge and fades out by 300 pt, as in the prototype.
 */
export function TodayPage({
  day,
  scrollRef,
  onSettings,
  onQuickAdd,
}: {
  readonly day: DailyNumber;
  readonly scrollRef: AnimatedRef<Animated.ScrollView>;
  readonly onSettings: () => void;
  readonly onQuickAdd: () => void;
}) {
  const { palette } = useTheme();
  const router = useRouter();
  const { hour } = useClock();
  const snap = useMoney();
  const actions = useMoneyActions();
  const onScroll = useHomePageScroll('today');
  const view = todayView(snap, hour, day.spent, useSpendLabels());
  const { y } = useHomeScroll();
  const parallax = useAnimatedStyle(() => ({
    transformOrigin: '50% 100%',
    opacity: Math.max(0, Math.min(1, 1 - y.value / 300)),
    transform: [{ translateY: y.value * 0.5 }, { scale: 1 - Math.min(y.value, 320) / 3200 }],
  }));

  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={parallax}>
        <TodayHero day={day} onSettings={onSettings} onQuickAdd={onQuickAdd} />
      </Animated.View>
      <View
        style={{
          minHeight: 540,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          backgroundColor: palette.sheet,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
          paddingTop: snap.plan?.serious ? 20 : 92,
          paddingHorizontal: 16,
          paddingBottom: 128,
          gap: 28,
        }}
      >
        {snap.plan ? (
          <CompanionGreeting
            day={day}
            plan={snap.plan}
            event={
              view.moment === 'closed'
                ? 'closedIdle'
                : view.moment === 'late'
                  ? 'late'
                  : day.safe < 0
                    ? 'replan'
                    : 'idle'
            }
            onPress={() => undefined}
          />
        ) : null}
        <TonightCard
          moment={view.moment}
          closeAt={snap.plan?.closeAt ?? '18:00'}
          toConfirm={view.queue.length}
          day={day}
          week={view.week}
          closedThisMonth={view.closedThisMonth}
          daysThisMonth={view.daysThisMonth}
          onClose={() => router.push('/close')}
        />
        <TodayList
          rows={view.rows}
          waiting={view.queue.length}
          spentLabel={view.spentLabel}
          onOpenInbox={() => router.push('/inbox')}
          onOpenSpend={() => undefined}
          onConfirm={(id) => void actions.setStatus(id, 'kept')}
          onDelete={(id) => void actions.setStatus(id, 'deleted')}
        />
      </View>
    </Animated.ScrollView>
  );
}
