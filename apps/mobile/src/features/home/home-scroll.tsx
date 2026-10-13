import { createContext, use, useMemo, type ReactNode } from 'react';
import {
  Easing,
  ReduceMotion,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { gestures } from '@6pm/theme';

import { useHomeNav } from './home-nav';
import { HOME_TABS, NAV_AFTER, type HomeTab } from './home-tabs';

/** Scroll state the home chrome reacts to, all on the UI thread. */
export interface HomeScroll {
  /** The active page's scroll offset (the prototype's `--sy`): hero parallax and fade. */
  readonly y: SharedValue<number>;
  /** 0 → 1 as the compact top bar fades in (`--nav`). */
  readonly nav: SharedValue<number>;
  /** 1 while the tab bar is condensed (scrolling down past 80 pt), animated. */
  readonly barMin: SharedValue<number>;
  /** Each page's own scroll offset, by index into `HOME_TABS`, kept while it is off screen too. */
  readonly pageY: readonly [SharedValue<number>, SharedValue<number>, SharedValue<number>];
}

const NAV_AFTER_BY_INDEX = HOME_TABS.map((tab) => NAV_AFTER[tab]);

/** How far the compact top bar is in (0 → 1) for page `index` scrolled to `offset`. */
export function navFor(offset: number, index: number): number {
  'worklet';
  return Math.max(0, Math.min(1, (offset - (NAV_AFTER_BY_INDEX[index] ?? 40)) / 36));
}

const HomeScrollContext = createContext<HomeScroll | null>(null);

export function HomeScrollProvider({ children }: { readonly children: ReactNode }) {
  const y = useSharedValue(0);
  const nav = useSharedValue(0);
  const barMin = useSharedValue(0);
  const today = useSharedValue(0);
  const plan = useSharedValue(0);
  const diary = useSharedValue(0);
  const value = useMemo(
    () => ({ y, nav, barMin, pageY: [today, plan, diary] as const }),
    [y, nav, barMin, today, plan, diary],
  );
  return <HomeScrollContext value={value}>{children}</HomeScrollContext>;
}

export function useHomeScroll(): HomeScroll {
  const value = use(HomeScrollContext);
  if (!value) throw new Error('useHomeScroll needs a HomeScrollProvider above it');
  return value;
}

const barEase = Easing.bezier(0.2, 0.9, 0.25, 1.1);
const BAR_MS = 350;

/**
 * The scroll handler a home page attaches: it drives the parallax, the compact top bar, and the
 * tab bar condensing on the way down and growing back on the way up, exactly as the prototype's
 * `onScroll` does (6 pt of travel decides the direction; above 80 pt the bar is always full).
 */
export function useHomePageScroll(tab: HomeTab) {
  const { y, nav, barMin, pageY } = useHomeScroll();
  const { tabIndex } = useHomeNav();
  const index = HOME_TABS.indexOf(tab);
  const last = pageY[index] ?? pageY[0];
  const condensed = useSharedValue(false);
  return useAnimatedScrollHandler({
    onScroll: (event) => {
      const offset = Math.max(0, event.contentOffset.y);
      // A page left behind can still coast; only the page on screen drives the shared chrome.
      if (tabIndex.get() !== index) {
        last.set(offset);
        return;
      }
      y.set(offset);
      nav.set(navFor(offset, index));
      const delta = offset - last.get();
      last.set(offset);
      const next =
        offset < gestures.barCondenseAfter
          ? false
          : delta > 6
            ? true
            : delta < -6
              ? false
              : condensed.get();
      if (next !== condensed.get()) {
        condensed.set(next);
        barMin.set(
          withTiming(next ? 1 : 0, {
            duration: BAR_MS,
            easing: barEase,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }
    },
  });
}
