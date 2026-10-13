import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type Animated from 'react-native-reanimated';
import {
  ReduceMotion,
  scrollTo,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedRef,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { easeOut } from '../../ui/motion/curves';
import { navFor, useHomeScroll } from './home-scroll';
import { HOME_TABS } from './home-tabs';
import { followFinger, landingPage } from './pager';

/**
 * A released swipe settles at the finger's speed with no bounce past the page. It finishes a move
 * the finger started, so it runs with reduced motion too.
 */
const SETTLE = {
  duration: 300,
  dampingRatio: 1,
  overshootClamping: true,
  reduceMotion: ReduceMotion.Never,
} as const;
const LAST = HOME_TABS.length - 1;

type PageRefs = readonly [
  AnimatedRef<Animated.ScrollView>,
  AnimatedRef<Animated.ScrollView>,
  AnimatedRef<Animated.ScrollView>,
];

/**
 * The home pager. A swipe moves the pages one to one with the finger (giving like rubber past
 * Today and Diary) and lands where the release was heading, at the finger's speed. A tab chosen
 * any other way shows at once: tabs are peers, so a tap does not slide. Every tab opens at its
 * top, and the top bar and sky follow the page in view as it moves.
 */
export function useHomePager({
  startIndex,
  refs,
  mounted,
  width,
  build,
  onCommit,
}: {
  readonly startIndex: number;
  readonly refs: PageRefs;
  readonly mounted: readonly boolean[];
  readonly width: number;
  readonly build: (index: number) => void;
  /** Runs on the JS thread once the tab on show has changed; `swiped` when a finger did it. */
  readonly onCommit: (index: number, swiped: boolean) => void;
}) {
  const { y, nav, barMin, pageY } = useHomeScroll();
  // The UI thread owns which tab is showing; React follows a frame later.
  const tabIndex = useSharedValue(startIndex);
  const position = useSharedValue(startIndex);
  const built = useSharedValue<boolean[]>([...mounted]);
  const pageWidth = useSharedValue(width);
  const lo = useSharedValue(startIndex);
  const hi = useSharedValue(startIndex);
  const grab = useSharedValue(startIndex);
  const [todayRef, planRef, diaryRef] = refs;

  useEffect(() => {
    built.set([...mounted]);
  }, [built, mounted]);
  useEffect(() => {
    pageWidth.set(width);
  }, [pageWidth, width]);

  /** Scrolls every built page but `keep` back to its top, out of sight. */
  const resetPages = useCallback(
    (keep: number) => {
      'worklet';
      for (let i = 0; i <= LAST; i++) {
        if (i === keep || !built.get()[i]) continue;
        scrollTo(i === 0 ? todayRef : i === 1 ? planRef : diaryRef, 0, 0, false);
        pageY[i]?.set(0);
      }
    },
    [built, todayRef, planRef, diaryRef, pageY],
  );

  const commit = useCallback(
    (to: number, swiped: boolean) => {
      'worklet';
      tabIndex.set(to);
      barMin.set(
        withTiming(0, { duration: 250, easing: easeOut, reduceMotion: ReduceMotion.System }),
      );
      scheduleOnRN(onCommit, to, swiped);
    },
    [tabIndex, barMin, onCommit],
  );

  /** Shows tab `to` in this frame; the one it leaves goes back to its top out of sight. */
  const jumpTo = useCallback(
    (to: number) => {
      'worklet';
      if (to < 0 || to > LAST || (to === tabIndex.get() && position.get() === to)) return;
      resetPages(to);
      if (to !== tabIndex.get()) commit(to, false);
      position.set(to);
    },
    [tabIndex, position, resetPages, commit],
  );

  // The top bar and the sky read the page in view: between two pages, a blend of both.
  useAnimatedReaction(
    () => position.get(),
    (p, previous) => {
      if (previous === null || p === previous) return;
      const a = Math.max(0, Math.min(LAST, Math.floor(p)));
      const b = Math.max(0, Math.min(LAST, Math.ceil(p)));
      const t = a === b ? 0 : p - a;
      const ya = pageY[a]?.get() ?? 0;
      const yb = pageY[b]?.get() ?? 0;
      y.set(ya + (yb - ya) * t);
      nav.set(navFor(ya, a) + (navFor(yb, b) - navFor(ya, a)) * t);
    },
  );

  // A tab asked for before its page is built shows once the page exists, never the sky alone.
  const pending = useRef<number | null>(null);
  const mountedRef = useRef(mounted);
  const goTo = useCallback(
    (index: number) => {
      if (mountedRef.current[index]) {
        scheduleOnUI(jumpTo, index);
        return;
      }
      pending.current = index;
      build(index);
    },
    [build, jumpTo],
  );
  useEffect(() => {
    mountedRef.current = mounted;
    const index = pending.current;
    if (index !== null && mounted[index]) {
      pending.current = null;
      scheduleOnUI(jumpTo, index);
    }
  }, [mounted, jumpTo]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-10, 10])
        .onStart((e) => {
          const from = tabIndex.get();
          const ready = built.get();
          const prev = from - 1;
          const next = from + 1;
          lo.set(prev >= 0 && ready[prev] ? prev : from);
          hi.set(next <= LAST && ready[next] ? next : from);
          if (prev >= 0 && !ready[prev]) scheduleOnRN(build, prev);
          if (next <= LAST && !ready[next]) scheduleOnRN(build, next);
          // Picked up where the pages are, even mid-settle, with no jump for the slop.
          const w = pageWidth.get();
          grab.set(position.get() + (w > 0 ? e.translationX / w : 0));
        })
        .onUpdate((e) => {
          const w = pageWidth.get();
          if (w <= 0) return;
          position.set(followFinger(grab.get() - e.translationX / w, lo.get(), hi.get(), w));
        })
        .onEnd((e) => {
          const w = pageWidth.get();
          const from = tabIndex.get();
          const to = landingPage({
            position: position.get(),
            velocity: e.velocityX,
            width: w,
            current: from,
            lo: lo.get(),
            hi: hi.get(),
          });
          if (to !== from) commit(to, true);
          position.set(
            withSpring(to, { ...SETTLE, velocity: w > 0 ? -e.velocityX / w : 0 }, (finished) => {
              if (finished) resetPages(to);
            }),
          );
        }),
    [tabIndex, built, lo, hi, grab, pageWidth, position, build, commit, resetPages],
  );

  return { tabIndex, position, pan, goTo };
}
