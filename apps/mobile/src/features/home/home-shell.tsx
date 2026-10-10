import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedRef,
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
import { HomeScrollProvider, useHomeScroll } from './home-scroll';
import { HOME_TABS, type HomeTab } from './home-tabs';
import { HomeTopNav } from './home-top-nav';
import { ScanFab } from './scan-fab';
import { TabBar, TabBarRow } from './tab-bar';

const enterEase = Easing.bezier(...curves.enter);
const settleEase = Easing.bezier(0.2, 0.9, 0.25, 1.1);
const ENTER_MS = 420;
const SETTLE_MS = 450;
const FLICK = 600;

function Shell({ day, initialTab }: { readonly day: DailyNumber; readonly initialTab: HomeTab }) {
  const router = useRouter();
  const { palette, look, serious } = useTheme();
  const { hour } = useClock();
  const { t } = useI18n();
  const { bottom } = useDesignInsets();
  const { y, nav, barMin } = useHomeScroll();
  const [tab, setTab] = useState<HomeTab>(initialTab);
  const refs: Record<HomeTab, AnimatedRef<Animated.ScrollView>> = {
    today: useAnimatedRef<Animated.ScrollView>(),
    plan: useAnimatedRef<Animated.ScrollView>(),
    diary: useAnimatedRef<Animated.ScrollView>(),
  };
  const planSections = useRef<PlanSectionsHandle>(null);
  const [planSection, setPlanSection] = useState(0);
  const index = HOME_TABS.indexOf(tab);
  const drag = useSharedValue(0);
  const enterX = useSharedValue(0);
  const enterOpacity = useSharedValue(1);

  /** Every new tab starts at its top with the bars reset, sliding in from the side it lies on. */
  const go = useCallback(
    (next: HomeTab) => {
      const dir = Math.sign(HOME_TABS.indexOf(next) - HOME_TABS.indexOf(tab));
      drag.value = 0;
      y.value = 0;
      nav.value = 0;
      barMin.value = withTiming(0, { duration: 250 });
      enterX.value = dir * 44;
      enterOpacity.value = 0;
      enterX.value = withTiming(0, { duration: ENTER_MS, easing: enterEase });
      enterOpacity.value = withTiming(1, { duration: ENTER_MS, easing: enterEase });
      // Every tab opens at its top, as the prototype's resetScroll does.
      const incoming = refs[next];
      runOnUI(() => {
        'worklet';
        scrollTo(incoming, 0, 0, false);
      })();
      setPlanSection(0);
      setTab(next);
    },
    [tab, drag, y, nav, barMin, enterX, enterOpacity],
  );

  const swipeTo = (j: number) => {
    const next = HOME_TABS[j];
    if (!next) return;
    haptics.tick();
    go(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      const atEdge = (e.translationX > 0 && index === 0) || (e.translationX < 0 && index === 2);
      drag.value = e.translationX * (atEdge ? 0.16 : 0.45);
    })
    .onEnd((e) => {
      const left = e.translationX < -gestures.tabSwipe || e.velocityX < -FLICK;
      const right = e.translationX > gestures.tabSwipe || e.velocityX > FLICK;
      const j = left ? index + 1 : right ? index - 1 : index;
      if (j !== index && j >= 0 && j < HOME_TABS.length) {
        runOnJS(swipeTo)(j);
      } else {
        drag.value = withTiming(0, { duration: SETTLE_MS, easing: settleEase });
      }
    });

  const page = useAnimatedStyle(() => ({
    opacity: enterOpacity.value * (1 - Math.min(Math.abs(drag.value) / 420, 0.3)),
    transform: [{ translateX: enterX.value + drag.value }],
  }));

  const scrollTop = () => {
    const ref = refs[tab];
    runOnUI(() => {
      'worklet';
      scrollTo(ref, 0, 0, true);
    })();
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.st[2] }}>
      <Sky look={look} hour={hour} serious={serious} scrollY={y} showSun={tab === 'today'} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, page]}>
          <View style={[StyleSheet.absoluteFill, tab !== 'today' && styles.hidden]}>
            <TodayPage
              day={day}
              scrollRef={refs.today}
              onSettings={() => router.push('/settings')}
              onQuickAdd={() => router.push('/quick-add')}
            />
          </View>
          <View style={[StyleSheet.absoluteFill, tab !== 'plan' && styles.hidden]}>
            <PlanPage
              scrollRef={refs.plan}
              sectionsRef={planSections}
              onSectionChange={setPlanSection}
            />
          </View>
          <View style={[StyleSheet.absoluteFill, tab !== 'diary' && styles.hidden]}>
            <DiaryPage scrollRef={refs.diary} />
          </View>
        </Animated.View>
      </GestureDetector>
      <HomeTopNav
        tab={tab}
        day={day}
        onPressTop={scrollTop}
        planSection={planSection}
        onPlanSection={(k) => planSections.current?.scrollToSection(k)}
      />
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(26) }}
      >
        <TabBarRow>
          <TabBar active={tab} onSelect={go} onReselect={scrollTop} />
          <ScanFab
            label={t('home.scan')}
            hint={t('home.scanHint')}
            onScan={() => router.push('/scan')}
            onQuickAdd={() => router.push('/quick-add')}
          />
        </TabBarRow>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ hidden: { display: 'none' } });

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
