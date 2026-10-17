import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedRef,
} from 'react-native-reanimated';

import { clockOf, hourOf, type DailyNumber } from '@6pm/domain';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useClock } from '../../ui/theme/clock';
import { useOfferUndo } from '../../ui/undo/undo-host';
import { useTheme } from '../../ui/theme/theme';
import { useRunAction } from '../companion/use-run-action';
import { useParkedClose } from '../close/close-session';
import { useHomePageShown } from '../home/home-page';
import { useHomePageScroll, useHomeScroll } from '../home/home-scroll';
import { CompanionGreeting } from './companion-greeting';
import { requestDiaryDay } from './diary-request';
import { TodayHero } from './today-hero';
import { TodayList } from './today-list';
import { todayView, type WeekDay } from './today-view';
import { useSpendLabels } from './use-spend-rows';
import { TonightCard } from './tonight-card';
import { useOpenAsk, useOpenSpend } from '../duo/spread-pane';
import { useTryingOn } from '../looks/look-settings-provider';

/**
 * Today: the hero over the sky, then the sheet that holds the companion, tonight's card, the week
 * and the list. As the page scrolls the hero drifts at half speed, shrinks a touch toward its
 * bottom edge and fades out by 300 pt, as in the prototype. While a look is tried on the sheet
 * fades away (`App:155`), so the sky and the number are seen in the look above the Looks sheet.
 */
export function TodayPage({
  day,
  scrollRef,
  onSettings,
  onQuickAdd,
  onOpenDiary,
}: {
  readonly day: DailyNumber;
  readonly scrollRef: AnimatedRef<Animated.ScrollView>;
  readonly onSettings: () => void;
  readonly onQuickAdd: () => void;
  /** Switches the home surface to the Diary tab; the day to show is already requested. */
  readonly onOpenDiary?: () => void;
}) {
  const { palette } = useTheme();
  const router = useRouter();
  const openSpend = useOpenSpend();
  const openAsk = useOpenAsk();
  const { closeHour, dayDate } = useClock();
  const snap = useMoney();
  const actions = useMoneyActions();
  const run = useRunAction();
  const offerUndo = useOfferUndo();
  const { t, language } = useI18n();
  const parked = useParkedClose(snap.today);
  const onScroll = useHomePageScroll('today');
  const shown = useHomePageShown();
  const view = todayView(snap, closeHour, day.spent, useSpendLabels());
  const monthName = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
    month: 'long',
  }).format(dayDate);
  const showDiary = (target: string) => {
    requestDiaryDay(target);
    onOpenDiary?.();
  };
  const openWeekDay = (w: WeekDay) => {
    if (w.closed) showDiary(w.day);
    else if (w.isToday) router.push('/close');
    else if (w.missed) router.push(`/missed-day?day=${w.day}` as Href);
  };
  const { y } = useHomeScroll();
  const parallax = useAnimatedStyle(() => ({
    transformOrigin: '50% 100%',
    opacity: Math.max(0, Math.min(1, 1 - y.value / 300)),
    transform: [{ translateY: y.value * 0.5 }, { scale: 1 - Math.min(y.value, 320) / 3200 }],
  }));

  const trying = useTryingOn();
  const sheetShown = useSharedValue(trying ? 0 : 1);
  useEffect(() => {
    sheetShown.set(
      withTiming(trying ? 0 : 1, { duration: 300, reduceMotion: ReduceMotion.System }),
    );
  }, [trying, sheetShown]);
  const sheetFade = useAnimatedStyle(() => ({ opacity: sheetShown.get() }));

  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollsToTop={shown}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={parallax}>
        <TodayHero day={day} onSettings={onSettings} onQuickAdd={onQuickAdd} />
      </Animated.View>
      <Animated.View
        style={[
          {
            minHeight: 540,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            backgroundColor: palette.sheet,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
            // The companion's greeting keeps its own room under it.
            paddingTop: snap.plan ? 20 : 92,
            paddingHorizontal: 16,
            paddingBottom: 128,
            gap: 28,
          },
          sheetFade,
        ]}
      >
        {snap.plan ? (
          <CompanionGreeting
            day={day}
            plan={snap.plan}
            event={
              view.moment === 'closed'
                ? 'closedIdle'
                : parked
                  ? 'paused'
                  : view.moment === 'late'
                    ? 'late'
                    : day.overspent && day.spent > 0
                      ? 'pastPlan'
                      : day.safe < 0
                        ? 'replan'
                        : 'idle'
            }
            onPress={() => openAsk()}
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
          paused={parked === null ? null : parked.state.step === 'cards' ? 'cards' : 'later'}
          closedStamp={view.closedAt === null ? null : clockOf(hourOf(new Date(view.closedAt)))}
          monthName={monthName}
          onClose={() => router.push('/close')}
          onOpenDay={openWeekDay}
          onOpenReceipt={() => showDiary(snap.today)}
        />
        <TodayList
          rows={view.rows}
          waiting={view.queue.length}
          spentLabel={view.spentLabel}
          onOpenInbox={() => router.push('/inbox')}
          onOpenSpend={openSpend}
          onConfirm={(id) => void run(() => actions.setStatus(id, 'kept'))}
          onDelete={(id) => {
            const name = snap.cycleSpends.find((s) => s.id === id)?.merchant ?? '';
            void run(() => actions.setStatus(id, 'deleted')).then((saved) => {
              if (saved) {
                offerUndo(
                  t('undo.deleted', { name }),
                  t('undo.action'),
                  () => void run(() => actions.undo(id)),
                );
              }
            });
          }}
        />
      </Animated.View>
    </Animated.ScrollView>
  );
}
