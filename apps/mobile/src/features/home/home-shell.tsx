import { useRouter } from 'expo-router';
import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { DailyNumber } from '@6pm/domain';
import { curves, gestures } from '@6pm/theme';

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
import { TabBar, TabBarRow } from './tab-bar';

const enterEase = Easing.bezier(...curves.enter);
const settleEase = Easing.bezier(0.2, 0.9, 0.25, 1.1);
const ENTER_MS = 420;
const SETTLE_MS = 450;
const FLICK = 600;
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
  const { bottom } = useDesignInsets();
  const { y, nav, barMin } = useHomeScroll();
  const [tab, setTab] = useState<HomeTab>(initialTab);
  const startIndex = HOME_TABS.indexOf(initialTab);
  const [mounted, setMounted] = useState<Mounted>(() => [true, startIndex === 1, startIndex === 2]);
  const todayRef = useAnimatedRef<Animated.ScrollView>();
  const planRef = useAnimatedRef<Animated.ScrollView>();
  const diaryRef = useAnimatedRef<Animated.ScrollView>();
  const planSections = useRef<PlanSectionsHandle>(null);
  const [planSection, setPlanSection] = useState(0);
  const homeVisible = useHomeVisible();

  // The UI thread owns which tab is showing; React follows a frame later.
  const tabIndex = useSharedValue(startIndex);
  const built = useSharedValue<boolean[]>([...mounted]);
  const drag = useSharedValue(0);
  const enterX = useSharedValue(0);
  const enterOpacity = useSharedValue(1);
  const sunShown = useDerivedValue(() => tabIndex.value === 0);

  const build = useCallback((index: number) => {
    setMounted((current) =>
      current[index] ? current : (current.map((on, i) => on || i === index) as unknown as Mounted),
    );
  }, []);
  useEffect(() => {
    built.value = [...mounted];
  }, [built, mounted]);

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

  /**
   * Every new tab starts at its top with the bars reset, sliding in from the side it lies on. All
   * of it starts on the UI thread in the frame it is asked for, inside the gesture that asked.
   */
  const slideTo = useCallback(
    (to: number, swiped: boolean) => {
      'worklet';
      const from = tabIndex.value;
      if (to === from || to < 0 || to >= HOME_TABS.length) return;
      tabIndex.value = to;
      drag.value = 0;
      y.value = 0;
      nav.value = 0;
      barMin.value = withTiming(0, { duration: 250 });
      enterX.value = Math.sign(to - from) * 44;
      enterOpacity.value = 0;
      enterX.value = withTiming(0, { duration: ENTER_MS, easing: enterEase });
      enterOpacity.value = withTiming(1, { duration: ENTER_MS, easing: enterEase });
      // Every tab opens at its top, as the prototype's resetScroll does. A page still to be built
      // starts there anyway.
      if (built.value[to]) {
        scrollTo(to === 0 ? todayRef : to === 1 ? planRef : diaryRef, 0, 0, false);
      }
      runOnJS(commitTab)(to, swiped);
    },
    [
      tabIndex,
      built,
      drag,
      y,
      nav,
      barMin,
      enterX,
      enterOpacity,
      todayRef,
      planRef,
      diaryRef,
      commitTab,
    ],
  );

  // A tab asked for before its page is built slides in once the page exists, so the slide never
  // shows the sky alone where the page should be.
  const pendingSlide = useRef<{ index: number; swiped: boolean } | null>(null);
  const mountedRef = useRef<Mounted>(mounted);
  const slideWhenBuilt = useCallback(
    (index: number, swiped: boolean) => {
      if (mountedRef.current[index]) {
        runOnUI(slideTo)(index, swiped);
        return;
      }
      pendingSlide.current = { index, swiped };
      build(index);
    },
    [build, slideTo],
  );
  useEffect(() => {
    mountedRef.current = mounted;
    const pending = pendingSlide.current;
    if (pending && mounted[pending.index]) {
      pendingSlide.current = null;
      runOnUI(slideTo)(pending.index, pending.swiped);
    }
  }, [mounted, slideTo]);

  const goToTab = useCallback(
    (next: HomeTab) => slideWhenBuilt(HOME_TABS.indexOf(next), false),
    [slideWhenBuilt],
  );
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

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-10, 10])
        .onUpdate((e) => {
          const index = tabIndex.value;
          const atEdge = (e.translationX > 0 && index === 0) || (e.translationX < 0 && index === 2);
          drag.value = e.translationX * (atEdge ? 0.16 : 0.45);
        })
        .onEnd((e) => {
          const index = tabIndex.value;
          const left = e.translationX < -gestures.tabSwipe || e.velocityX < -FLICK;
          const right = e.translationX > gestures.tabSwipe || e.velocityX > FLICK;
          const j = left ? index + 1 : right ? index - 1 : index;
          if (j !== index && j >= 0 && j < HOME_TABS.length && built.value[j]) {
            slideTo(j, true);
          } else if (j !== index && j >= 0 && j < HOME_TABS.length) {
            drag.value = withTiming(0, { duration: SETTLE_MS, easing: settleEase });
            runOnJS(slideWhenBuilt)(j, true);
          } else {
            drag.value = withTiming(0, { duration: SETTLE_MS, easing: settleEase });
          }
        }),
    [tabIndex, drag, built, slideTo, slideWhenBuilt],
  );

  const page = useAnimatedStyle(() => ({
    opacity: enterOpacity.value * (1 - Math.min(Math.abs(drag.value) / 420, 0.3)),
    transform: [{ translateX: enterX.value + drag.value }],
  }));

  const scrollTop = useCallback(() => {
    runOnUI(() => {
      'worklet';
      const i = tabIndex.value;
      scrollTo(i === 0 ? todayRef : i === 1 ? planRef : diaryRef, 0, 0, true);
    })();
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
      <View style={{ flex: 1, backgroundColor: palette.st[2] }}>
        <Sky
          look={look}
          hour={hour}
          serious={serious}
          scrollY={y}
          showSun={sun}
          active={homeVisible}
        />
        <GestureDetector gesture={pan}>
          <Animated.View style={[StyleSheet.absoluteFill, page]}>
            <HomePage
              index={0}
              tabIndex={tabIndex}
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
              homeVisible={homeVisible}
              shown={tab === 'diary'}
            >
              {mounted[2] ? <Diary scrollRef={diaryRef} /> : null}
            </HomePage>
          </Animated.View>
        </GestureDetector>
        <HomeTopNav
          tab={tab}
          day={day}
          onPressTop={scrollTop}
          onQuickAdd={openQuickAdd}
          planSection={planSection}
          onPlanSection={jumpToSection}
        />
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
      </View>
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
