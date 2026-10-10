import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type Animated from 'react-native-reanimated';
import {
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';

/** The anchors the compact top bar's chips jump to: Overview, Bills, Future you, Occasions. */
export const PLAN_SECTIONS = ['overview', 'bills', 'futureYou', 'occasions'] as const;
export type PlanSection = (typeof PLAN_SECTIONS)[number];

export interface PlanSectionsHandle {
  /** Scrolls so section `index` sits under the compact bar, as the prototype's `jumpSec`. */
  scrollToSection(index: number): void;
}

/** How long a jump's smooth scroll keeps the chips from following the scroll (prototype: 700 ms). */
const JUMP_MS = 700;

/**
 * Tracks which section is under the compact bar while the page scrolls (a section counts once its
 * top is within 170 pt of the top, and the last one wins at the bottom), all on the UI thread;
 * the index crosses to JS only when it changes.
 */
export function usePlanSections({
  y,
  scrollRef,
  handleRef,
  onSectionChange,
  activeAt,
  jumpTo,
}: {
  readonly y: SharedValue<number>;
  readonly scrollRef: AnimatedRef<Animated.ScrollView>;
  readonly handleRef: Ref<PlanSectionsHandle> | undefined;
  readonly onSectionChange: ((index: number) => void) | undefined;
  /** Offset from the top at which a section becomes current (prototype 170, safe-area adjusted). */
  readonly activeAt: number;
  /** Where a jumped-to section lands below the top (prototype 150, safe-area adjusted). */
  readonly jumpTo: number;
}) {
  const tops = useSharedValue<number[]>(PLAN_SECTIONS.map(() => 0));
  const viewport = useSharedValue(0);
  const content = useSharedValue(0);
  const jumping = useSharedValue(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const report = useCallback((index: number) => onSectionChange?.(index), [onSectionChange]);

  useAnimatedReaction(
    () => {
      const offset = y.value;
      let k = 0;
      for (let i = 0; i < tops.value.length; i++) {
        if ((tops.value[i] ?? 0) - activeAt <= offset) k = i;
      }
      if (viewport.value > 0 && offset + viewport.value >= content.value - 4) {
        k = tops.value.length - 1;
      }
      return k;
    },
    (k, previous) => {
      if (previous !== null && k !== previous && !jumping.value) runOnJS(report)(k);
    },
  );

  const scrollToSection = useCallback(
    (index: number) => {
      const top = tops.value[index];
      if (top === undefined) return;
      jumping.value = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        jumping.value = false;
      }, JUMP_MS);
      scrollTo(scrollRef, 0, Math.max(0, top - jumpTo), true);
      report(index);
    },
    [tops, jumping, scrollRef, jumpTo, report],
  );

  useImperativeHandle(handleRef, () => ({ scrollToSection }), [scrollToSection]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return {
    viewport,
    /** onLayout for section `index` (a direct child of the scroll content). */
    sectionLayout: (index: number) => (e: LayoutChangeEvent) => {
      const top = e.nativeEvent.layout.y;
      tops.modify((list) => {
        'worklet';
        list[index] = top;
        return list;
      });
    },
    onViewportLayout: (e: LayoutChangeEvent) => {
      viewport.value = e.nativeEvent.layout.height;
    },
    onContentSizeChange: (_w: number, h: number) => {
      content.value = h;
    },
  };
}
