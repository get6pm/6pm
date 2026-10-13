import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeInOut } from '../../ui/motion/curves';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useHomeScroll } from './home-scroll';
import { HOME_TABS, TAB_META, type HomeTab } from './home-tabs';

const PILL_MS = 250;
/** How much the bar loses when it condenses: 64 → 52 pt tall, and the scan button beside it too. */
const SHRINK = 12;
/** How far an icon drops when the labels go, to sit in the middle of the shorter bar. */
const ICON_DROP = 13;

/**
 * The floating glass tab bar. Tap a tab to go there (tap the active one to scroll to the top),
 * or slide along the bar to scrub between tabs with a tick per tab. It condenses from 64 to 52 pt
 * while scrolling down and hides its labels, widening into the room the scan button gives up.
 *
 * It is laid out once, at its condensed width in a 64 pt slot. The glass and the pill are
 * childless layers out of the flow, the only things that change size; the tabs move by transform.
 */
export const TabBar = memo(function TabBar({
  active,
  onSelect,
  onReselect,
}: {
  readonly active: HomeTab;
  readonly onSelect: (tab: HomeTab) => void;
  readonly onReselect: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { barMin } = useHomeScroll();
  const [width, setWidth] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const activeIndex = HOME_TABS.indexOf(active);
  const highlighted = scrub ?? activeIndex;

  const index = useSharedValue(activeIndex);
  const barWidth = useSharedValue(0);
  const scrubbing = useSharedValue(0);
  const scrubIndex = useSharedValue(-1);
  const activeShared = useSharedValue(activeIndex);

  useEffect(() => {
    index.set(
      withTiming(highlighted, {
        duration: PILL_MS,
        easing: easeInOut,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [highlighted, index]);
  useEffect(() => {
    activeShared.set(activeIndex);
  }, [activeShared, activeIndex]);

  // Read through refs so the scrub gesture is built once and never swapped mid-slide.
  const latest = useRef({ active, onSelect });
  latest.current = { active, onSelect };
  const handlers = useMemo(
    () => ({
      scrubTo: (k: number, crossed: boolean) => {
        setScrub(k);
        if (crossed) haptics.tick();
      },
      release: (k: number) => {
        setScrub(null);
        const tab = HOME_TABS[k];
        if (tab && tab !== latest.current.active) latest.current.onSelect(tab);
      },
    }),
    [],
  );

  // A tick each time the scrub crosses into another tab, not on the one it starts on.
  useAnimatedReaction(
    () => scrubIndex.get(),
    (k, previous) => {
      if (k < 0 || k === previous) return;
      scheduleOnRN(handlers.scrubTo, k, previous !== null && previous >= 0);
    },
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .onStart(() => {
          scrubIndex.set(activeShared.get());
          scrubbing.set(withTiming(1, { duration: 250 }));
        })
        .onUpdate((e) => {
          const segment = segmentAt(barWidth.get(), barMin.get());
          if (segment <= 0) return;
          const k = Math.max(0, Math.min(2, Math.floor((e.x - 4) / segment)));
          if (k !== scrubIndex.get()) scrubIndex.set(k);
        })
        .onFinalize(() => {
          const k = scrubIndex.get();
          if (k < 0) return;
          scrubIndex.set(-1);
          scrubbing.set(withTiming(0, { duration: 250 }));
          scheduleOnRN(handlers.release, k);
        }),
    [scrubIndex, activeShared, scrubbing, barWidth, barMin, handlers],
  );

  const glass = useAnimatedStyle(() => {
    const full = 1 - barMin.get();
    return { width: barWidth.get() - SHRINK * full, height: 64 - SHRINK + SHRINK * full };
  });
  const pill = useAnimatedStyle(() => {
    const segment = segmentAt(barWidth.get(), barMin.get());
    return {
      width: segment,
      height: 44 + SHRINK * (1 - barMin.get()),
      transform: [
        { translateX: 4 + segment * index.get() },
        { scaleX: 1 + 0.05 * scrubbing.get() },
        { scaleY: 1 + 0.12 * scrubbing.get() },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e: LayoutChangeEvent) => {
          setWidth(e.nativeEvent.layout.width);
          barWidth.set(e.nativeEvent.layout.width);
        }}
        style={{ flex: 1, height: 64, marginRight: -SHRINK }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              bottom: 0,
              borderRadius: 99,
              backgroundColor: palette.glass,
              boxShadow: palette.glassShadow,
            },
            glass,
          ]}
        />
        {width > 0 ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                bottom: 4,
                borderRadius: 99,
                backgroundColor: palette.tabActive,
              },
              pill,
            ]}
          />
        ) : null}
        {width > 0 ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: width - SHRINK,
              flexDirection: 'row',
              alignItems: 'center',
              padding: 4,
            }}
          >
            {HOME_TABS.map((tab, k) => (
              <TabButton
                key={tab}
                k={k}
                on={k === highlighted}
                selected={tab === active}
                label={t(TAB_META[tab].label)}
                icon={TAB_META[tab].icon}
                ink={palette.ink}
                barMin={barMin}
                onPress={() => (tab === active ? onReselect() : onSelect(tab))}
              />
            ))}
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
});

/** Width of one tab's share of the bar, `condensed` 0 (full) → 1, for a bar laid out `width` wide. */
function segmentAt(width: number, condensed: number): number {
  'worklet';
  return (width - SHRINK * (1 - condensed) - 8) / 3;
}

function TabButton({
  k,
  on,
  selected,
  label,
  icon,
  ink,
  barMin,
  onPress,
}: {
  readonly k: number;
  readonly on: boolean;
  readonly selected: boolean;
  readonly label: string;
  readonly icon: (typeof TAB_META)[HomeTab]['icon'];
  readonly ink: string;
  readonly barMin: SharedValue<number>;
  readonly onPress: () => void;
}) {
  // Each tab's share widens by a third of what the bar gains, so its centre shifts right.
  const slot = useAnimatedStyle(() => ({
    transform: [{ translateX: (SHRINK / 3) * (k + 0.5) * barMin.get() }],
  }));
  const content = useAnimatedStyle(() => ({
    transform: [{ translateY: ICON_DROP * barMin.get() }],
  }));
  const caption = useAnimatedStyle(() => ({
    opacity: interpolate(barMin.get(), [0, 0.6], [1, 0], 'clamp'),
  }));
  return (
    <Animated.View style={[{ flex: 1 }, slot]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        onPress={onPress}
        style={{ height: 56 }}
      >
        <Animated.View
          style={[
            {
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              opacity: on ? 1 : 0.62,
            },
            content,
          ]}
        >
          <Symbol name={icon} size={24} fill={on ? 1 : 0} weight={on ? 500 : 400} color={ink} />
          <Animated.View style={[{ height: 14, overflow: 'hidden' }, caption]}>
            <Text style={{ ...body(10.5, 600), lineHeight: 14, color: ink }}>{label}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** The bar's container: 16 pt from each side, 26 pt above the home indicator line. */
export function TabBarRow({ children }: { readonly children: ReactNode }) {
  return (
    <View
      pointerEvents="box-none"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}
    >
      {children}
    </View>
  );
}
