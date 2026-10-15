import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves } from '@6pm/theme';

import { useMoneyFormat } from '../../money/use-money-format';
import { CategoryTile } from '../../ui/category-tile';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import type { BillView } from './plan-view';

const ease = Easing.bezier(...curves.enter);
const TOGGLE_MS = 250;

/** One bill: its tile, name and due line (tap to edit), the amount, and the paid tick. */
export function BillRowView({
  view,
  first,
  sub,
  subColour,
  label,
  editLabel,
  onToggle,
  onEdit,
}: {
  readonly view: BillView;
  readonly first: boolean;
  readonly sub: string;
  readonly subColour: string;
  readonly label: string;
  readonly editLabel: string;
  readonly onToggle: () => void;
  readonly onEdit: () => void;
}) {
  const { palette } = useTheme();
  const money = useMoneyFormat();
  const reduceMotion = useReducedMotion();
  const paid = useSharedValue(view.paid ? 1 : 0);
  const pressed = useSharedValue(0);
  useEffect(() => {
    paid.value = withTiming(view.paid ? 1 : 0, {
      duration: reduceMotion ? 0 : TOGGLE_MS,
      easing: ease,
    });
  }, [view.paid, paid, reduceMotion]);
  const row = useAnimatedStyle(() => ({ opacity: 1 - 0.4 * paid.value }));
  const ring = useAnimatedStyle(() => ({
    borderColor: interpolateColor(paid.value, [0, 1], [palette.inkSoft, palette.btnBg]),
    backgroundColor: interpolateColor(paid.value, [0, 1], ['rgba(0,0,0,0)', palette.btnBg]),
    transform: [{ scale: 1 - 0.05 * pressed.value }],
  }));
  const tick = useAnimatedStyle(() => ({
    opacity: paid.value,
    transform: [{ scale: 0.6 + 0.4 * paid.value }],
  }));
  const { bill } = view;
  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          borderTopWidth: 0.5,
          borderColor: first ? 'transparent' : palette.hair,
        },
        row,
      ]}
    >
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={editLabel}
        scaleTo={0.98}
        onPress={onEdit}
        style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <CategoryTile icon={isSymbolName(bill.icon) ? bill.icon : 'payments'} hue={bill.hue} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={1} style={{ ...body(16, 550), color: palette.ink }}>
            {bill.name}
          </Text>
          <Text style={{ ...body(13), color: subColour }}>{sub}</Text>
        </View>
        <Text style={{ ...body(15, 600), ...tabular, color: palette.ink }}>
          {money.full(bill.amount)}
        </Text>
      </PressScale>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: view.paid }}
        accessibilityLabel={label}
        hitSlop={6}
        onPress={onToggle}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 60 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 240 });
        }}
      >
        <Animated.View
          style={[
            {
              width: 34,
              height: 34,
              borderRadius: 17,
              borderWidth: 1.5,
              alignItems: 'center',
              justifyContent: 'center',
            },
            ring,
          ]}
        >
          <Animated.View style={tick}>
            <Symbol name="check" size={20} color={palette.btnFg} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
