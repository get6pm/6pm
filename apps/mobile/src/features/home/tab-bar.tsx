import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useHomeScroll } from './home-scroll';
import { HOME_TABS, TAB_META, type HomeTab } from './home-tabs';

/** The active pill slides with a little overshoot: the prototype's `cubic-bezier(.3,1.3,.5,1)`. */
const pillEase = Easing.bezier(0.3, 1.3, 0.5, 1);
const PILL_MS = 400;

/**
 * The floating glass tab bar. Tap a tab to go there (tap the active one to scroll to the top),
 * or slide along the bar to scrub between tabs with a tick per tab. It condenses from 64 to 52 pt
 * while scrolling down and hides its labels.
 */
export function TabBar({
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
  const scrubbing = useSharedValue(0);
  const lastScrub = useSharedValue(-1);
  const segment = (width - 8) / 3;

  useEffect(() => {
    index.value = withTiming(highlighted, { duration: PILL_MS, easing: pillEase });
  }, [highlighted, index]);

  const scrubTo = (k: number) => {
    setScrub(k);
    haptics.tick();
  };
  const release = (k: number) => {
    setScrub(null);
    const tab = HOME_TABS[k];
    if (tab && tab !== active) onSelect(tab);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onBegin(() => {
      lastScrub.value = -1;
    })
    .onStart(() => {
      scrubbing.value = withTiming(1, { duration: 250 });
    })
    .onUpdate((e) => {
      if (segment <= 0) return;
      const k = Math.max(0, Math.min(2, Math.floor((e.x - 4) / segment)));
      if (k !== lastScrub.value) {
        lastScrub.value = k;
        runOnJS(scrubTo)(k);
      }
    })
    .onEnd(() => {
      scrubbing.value = withTiming(0, { duration: 250 });
      if (lastScrub.value >= 0) runOnJS(release)(lastScrub.value);
    });

  const bar = useAnimatedStyle(() => ({ height: interpolate(barMin.value, [0, 1], [64, 52]) }));
  const button = useAnimatedStyle(() => ({ height: interpolate(barMin.value, [0, 1], [56, 44]) }));
  const label = useAnimatedStyle(() => ({
    maxHeight: interpolate(barMin.value, [0, 1], [14, 0]),
    opacity: interpolate(barMin.value, [0, 0.6], [1, 0], 'clamp'),
  }));
  const pill = useAnimatedStyle(() => ({
    width: segment,
    transform: [
      { translateX: 4 + segment * index.value },
      { scaleX: 1 + 0.05 * scrubbing.value },
      { scaleY: 1 + 0.12 * scrubbing.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={[
          {
            flex: 1,
            borderRadius: 99,
            backgroundColor: palette.glass,
            boxShadow: palette.glassShadow,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 4,
          },
          bar,
        ]}
      >
        {width > 0 ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: 0,
                borderRadius: 99,
                backgroundColor: palette.tabActive,
              },
              pill,
            ]}
          />
        ) : null}
        {HOME_TABS.map((tab, k) => {
          const on = k === highlighted;
          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === active }}
              accessibilityLabel={t(TAB_META[tab].label)}
              onPress={() => (tab === active ? onReselect() : onSelect(tab))}
              style={{ flex: 1 }}
            >
              <Animated.View
                style={[
                  {
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    opacity: on ? 1 : 0.62,
                  },
                  button,
                ]}
              >
                <Symbol
                  name={TAB_META[tab].icon}
                  size={24}
                  fill={on ? 1 : 0}
                  weight={on ? 500 : 400}
                  color={palette.ink}
                />
                <Animated.View style={[{ overflow: 'hidden' }, label]}>
                  <Text style={{ ...body(10.5, 600), lineHeight: 14, color: palette.ink }}>
                    {t(TAB_META[tab].label)}
                  </Text>
                </Animated.View>
              </Animated.View>
            </Pressable>
          );
        })}
      </Animated.View>
    </GestureDetector>
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
