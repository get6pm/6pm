import { memo, useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { barGlass } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { easeInOut } from '../../ui/motion/curves';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { HOME_TABS, TAB_META, type HomeTab } from './home-tabs';

const PILL_MS = 250;
const WIDTH = 58;
const PAD = 4;
const TAB = 58;
const GAP = 2;

/**
 * The tab bar stood on its end, for the iPhone Duo's side rail: a glass column 58 pt wide with
 * Today, Plan and Diary one above the other, the highlight sliding between them. Tap a tab to go
 * there, the active one to scroll to the top.
 */
export const TabRail = memo(function TabRail({
  active,
  onSelect,
  onReselect,
}: {
  readonly active: HomeTab;
  readonly onSelect: (tab: HomeTab) => void;
  readonly onReselect: () => void;
}) {
  const { palette } = useTheme();
  const fill = useMemo(() => barGlass(palette), [palette]);
  const { t } = useI18n();
  const activeIndex = HOME_TABS.indexOf(active);
  const index = useSharedValue(activeIndex);

  useEffect(() => {
    index.set(
      withTiming(activeIndex, {
        duration: PILL_MS,
        easing: easeInOut,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [activeIndex, index]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateY: PAD + (TAB + GAP) * index.get() }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      style={{
        width: WIDTH,
        padding: PAD,
        gap: GAP,
        borderRadius: 99,
        backgroundColor: fill,
        boxShadow: palette.glassShadow,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: PAD,
            top: 0,
            width: WIDTH - 2 * PAD,
            height: TAB,
            borderRadius: 99,
            backgroundColor: palette.tabActive,
          },
          pill,
        ]}
      />
      {HOME_TABS.map((tab) => {
        const on = tab === active;
        const label = t(TAB_META[tab].label);
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label}
            onPress={() => (on ? onReselect() : onSelect(tab))}
            style={{
              height: TAB,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              opacity: on ? 1 : 0.62,
            }}
          >
            <Symbol
              name={TAB_META[tab].icon}
              size={23}
              fill={on ? 1 : 0}
              weight={on ? 500 : 400}
              color={palette.ink}
            />
            <Text numberOfLines={1} style={{ ...body(9.5, 650), color: palette.ink }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});
