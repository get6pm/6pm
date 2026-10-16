import { useRouter } from 'expo-router';
import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type Animated from 'react-native-reanimated';
import { scrollTo, useAnimatedRef, useDerivedValue } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import type { DailyNumber } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { Sky } from '../../ui/sky/sky';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { DiaryPage } from '../diary/diary-page';
import { PlanPage, type PlanSectionsHandle } from '../plan/plan-page';
import { TodayPage } from '../today/today-page';
import { HomeNavProvider, type HomeNav } from './home-nav';
import { HomePage } from './home-page';
import { HomeScrollProvider, useHomeScroll } from './home-scroll';
import { HOME_TABS, type HomeTab } from './home-tabs';
import { HomeTopNav } from './home-top-nav';
import { useHomeVisible } from './home-visible';
import { ScanFab } from './scan-fab';
import { SideRail } from './side-rail';
import { OpenAskProvider, OpenSpendProvider, SpreadPane } from '../duo/spread-pane';
import { AskPreview } from '../duo/ask-preview';
import { DiaryBridgeProvider } from '../duo/diary-bridge';
import { useSpreadPage } from '../duo/use-spread-page';
import { DayPane } from '../duo/day-pane';
import { useFoldForm } from '../../ui/layout/fold';
import { TabBar, TabBarRow } from './tab-bar';
import { useHomePager } from './use-home-pager';

/** Plan and Diary are built after Today has been on screen for a while, one after the other. */
const PREMOUNT_PLAN_MS = 600;
const PREMOUNT_DIARY_MS = 1400;

const Today = memo(TodayPage);
const Plan = memo(PlanPage);
const Diary = memo(DiaryPage);

type Mounted = readonly [boolean, boolean, boolean];

function Shell({ day, initialTab }: { readonly day: DailyNumber; readonly initialTab: HomeTab }) {
  const router = useRouter();
  const { palette, look, serious } = useTheme();
  const { hour } = useClock();
  const { t } = useI18n();
  const { bottom, rail } = useDesignInsets();
  // On the iPhone Duo the pages stop at the side rail; the sky still runs under it. Opened
  // sideways, they take the left page and the month fills the right one.
  const form = useFoldForm();
  const spread = form.kind === 'spread' ? form : null;
  const windowWidth = useWindowDimensions().width;
  const width = spread ? spread.left.width : windowWidth - rail;
  const page = useSpreadPage(spread !== null);
  const { pane, diaryDay, affording } = page;
  const { y } = useHomeScroll();
  const [tab, setTab] = useState<HomeTab>(initialTab);
  const startIndex = HOME_TABS.indexOf(initialTab);
  const [mounted, setMounted] = useState<Mounted>(() => [true, startIndex === 1, startIndex === 2]);
  const todayRef = useAnimatedRef<Animated.ScrollView>();
  const planRef = useAnimatedRef<Animated.ScrollView>();
  const diaryRef = useAnimatedRef<Animated.ScrollView>();
  const refs = useMemo(() => [todayRef, planRef, diaryRef] as const, [todayRef, planRef, diaryRef]);
  const planSections = useRef<PlanSectionsHandle>(null);
  const [planSection, setPlanSection] = useState(0);
  const homeVisible = useHomeVisible();
  const money = useMoney();
  // Neon Alley's sign knows when the day is closed.
  const closedToday = money.closedDays.some((d) => d.day === money.today);

  const build = useCallback((index: number) => {
    setMounted((current) =>
      current[index] ? current : (current.map((on, i) => on || i === index) as unknown as Mounted),
    );
  }, []);

  const commitTab = useCallback(
    (index: number, swiped: boolean) => {
      const next = HOME_TABS[index];
      if (!next) return;
      if (swiped) haptics.tick();
      setPlanSection(0);
      setTab(next);
      build(index);
    },
    [build],
  );

  const { tabIndex, position, pan, goTo } = useHomePager({
    startIndex,
    refs,
    mounted,
    width,
    build,
    onCommit: commitTab,
  });
  const sunShown = useDerivedValue(() => tabIndex.get() === 0);

  const goToTab = useCallback((next: HomeTab) => goTo(HOME_TABS.indexOf(next)), [goTo]);
  const homeNav = useMemo<HomeNav>(() => ({ tabIndex, goToTab }), [tabIndex, goToTab]);
  const openDiary = useCallback(() => goToTab('diary'), [goToTab]);

  // Plan and Diary are built when Today has settled, so the first frame holds only what is shown.
  useEffect(() => {
    const timers = [
      setTimeout(() => startTransition(() => build(1)), PREMOUNT_PLAN_MS),
      setTimeout(() => startTransition(() => build(2)), PREMOUNT_DIARY_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [build]);

  const scrollTop = useCallback(() => {
    scheduleOnUI(() => {
      'worklet';
      const i = tabIndex.get();
      scrollTo(i === 0 ? todayRef : i === 1 ? planRef : diaryRef, 0, 0, true);
    });
  }, [tabIndex, todayRef, planRef, diaryRef]);

  const openSettings = useCallback(() => router.push('/settings'), [router]);
  const openQuickAdd = useCallback(() => router.push('/quick-add'), [router]);
  const openScan = useCallback(() => router.push('/scan'), [router]);
  const jumpToSection = useCallback((k: number) => planSections.current?.scrollToSection(k), []);
  const sun = useMemo(
    () => ({ flag: sunShown, initial: initialTab === 'today' }),
    [sunShown, initialTab],
  );

  return (
    <HomeNavProvider value={homeNav}>
      <OpenSpendProvider value={spread ? page.openSpend : null}>
        <OpenAskProvider value={spread ? page.openAsk : null}>
          <DiaryBridgeProvider value={spread ? page.setDiaryDay : null}>
            <View style={{ flex: 1, backgroundColor: palette.st[2] }}>
              <Sky
                look={look}
                hour={hour}
                serious={serious}
                closed={closedToday}
                scrollY={y}
                showSun={sun}
                active={homeVisible}
              />
              <GestureDetector gesture={pan}>
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    spread ? { right: windowWidth - width, overflow: 'hidden' } : { right: rail },
                  ]}
                >
                  <HomePage
                    index={0}
                    tabIndex={tabIndex}
                    position={position}
                    width={width}
                    homeVisible={homeVisible}
                    shown={tab === 'today'}
                  >
                    <Today
                      day={day}
                      scrollRef={todayRef}
                      onSettings={openSettings}
                      onQuickAdd={openQuickAdd}
                      onOpenDiary={openDiary}
                    />
                  </HomePage>
                  <HomePage
                    index={1}
                    tabIndex={tabIndex}
                    position={position}
                    width={width}
                    homeVisible={homeVisible}
                    shown={tab === 'plan'}
                  >
                    {mounted[1] ? (
                      <Plan
                        active={tab === 'plan'}
                        scrollRef={planRef}
                        sectionsRef={planSections}
                        onSectionChange={setPlanSection}
                      />
                    ) : null}
                  </HomePage>
                  <HomePage
                    index={2}
                    tabIndex={tabIndex}
                    position={position}
                    width={width}
                    homeVisible={homeVisible}
                    shown={tab === 'diary'}
                  >
                    {mounted[2] ? <Diary scrollRef={diaryRef} /> : null}
                  </HomePage>
                </View>
              </GestureDetector>
              {spread ? (
                <View
                  style={{
                    position: 'absolute',
                    left: spread.right.x,
                    right: rail,
                    top: 14,
                    bottom: 14,
                  }}
                >
                  {tab === 'diary' && diaryDay && pane.kind !== 'ask' ? (
                    <DayPane view={diaryDay} />
                  ) : (
                    <SpreadPane
                      day={day}
                      view={pane}
                      onBack={page.back}
                      onAfford={page.setAffording}
                    />
                  )}
                </View>
              ) : null}
              {spread && pane.kind === 'ask' && affording !== null ? (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', left: 22, width: width - 50, bottom: bottom(28) }}
                >
                  <AskPreview day={day} amount={affording} />
                </View>
              ) : null}
              <HomeTopNav
                edge={spread ? windowWidth - width : rail}
                tab={tab}
                day={day}
                onPressTop={scrollTop}
                onQuickAdd={openQuickAdd}
                planSection={planSection}
                onPlanSection={jumpToSection}
              />
              {rail > 0 ? (
                <SideRail
                  tab={tab}
                  onSelect={goToTab}
                  onReselect={scrollTop}
                  onQuickAdd={openQuickAdd}
                  onSettings={openSettings}
                  onScan={openScan}
                />
              ) : (
                <View
                  pointerEvents="box-none"
                  style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(26) }}
                >
                  <TabBarRow>
                    <TabBar active={tab} onSelect={goToTab} onReselect={scrollTop} />
                    <ScanFab
                      label={t('home.scan')}
                      hint={t('home.scanHint')}
                      onScan={openScan}
                      onQuickAdd={openQuickAdd}
                    />
                  </TabBarRow>
                </View>
              )}
            </View>
          </DiaryBridgeProvider>
        </OpenAskProvider>
      </OpenSpendProvider>
    </HomeNavProvider>
  );
}

/** Home: Today, Plan and Diary as one swipeable surface under the glass tab bar and scan button. */
export function HomeShell({
  day,
  initialTab = 'today',
}: {
  readonly day: DailyNumber;
  readonly initialTab?: HomeTab;
}) {
  return (
    <HomeScrollProvider>
      <Shell day={day} initialTab={initialTab} />
    </HomeScrollProvider>
  );
}
