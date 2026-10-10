import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { formatShort, RIVER_SEGMENTS, type RiverSegment, type Vnd } from '@6pm/domain';
import { curves, durations } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import { PlanCard } from './plan-parts';
import type { PlanColours } from './plan-colours';

const enter = Easing.bezier(...curves.enter);
/** CSS `ease`, the prototype's transition for the selection. */
const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const WIDTH_MS = 450;
const SELECT_MS = 250;

export interface RiverCopy {
  readonly total: string;
  readonly hint: string;
  readonly label: Record<RiverSegment, string>;
  readonly note: Record<RiverSegment, string>;
}

function Segment({
  amount,
  colour,
  index,
  state,
  onPress,
  label,
}: {
  readonly amount: Vnd;
  readonly colour: string;
  readonly index: number;
  readonly state: 'none' | 'on' | 'off';
  readonly onPress: () => void;
  readonly label: string;
}) {
  const reduceMotion = useReducedMotion();
  const grow = useSharedValue(Math.max(amount, 1));
  const on = useSharedValue(state === 'on' ? 1 : 0);
  const dim = useSharedValue(state === 'off' ? 1 : 0);
  const pressed = useSharedValue(0);
  useEffect(() => {
    const ms = reduceMotion ? 0 : WIDTH_MS;
    grow.value = withTiming(Math.max(amount, 1), { duration: ms, easing: enter });
  }, [amount, grow, reduceMotion]);
  useEffect(() => {
    const ms = reduceMotion ? 0 : SELECT_MS;
    on.value = withTiming(state === 'on' ? 1 : 0, { duration: ms, easing: ease });
    dim.value = withTiming(state === 'off' ? 1 : 0, { duration: ms, easing: ease });
  }, [state, on, dim, reduceMotion]);
  const style = useAnimatedStyle(() => {
    const press = 1 - 0.05 * pressed.value;
    return {
      flexGrow: grow.value,
      opacity: 1 - 0.7 * dim.value,
      transform: [{ scaleX: press }, { scaleY: press * (1 + 0.14 * on.value) }],
    };
  });
  const last = index === RIVER_SEGMENTS.length - 1;
  const outer = 14;
  return (
    <Animated.View style={[{ flexBasis: 0, flexShrink: 1, minWidth: 8 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: state === 'on' }}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: durations.tap / 2, easing: enter });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: durations.tap * 2, easing: enter });
        }}
        style={{
          flex: 1,
          backgroundColor: colour,
          borderTopLeftRadius: index === 0 ? outer : 4,
          borderBottomLeftRadius: index === 0 ? outer : 4,
          borderTopRightRadius: last ? outer : 4,
          borderBottomRightRadius: last ? outer : 4,
        }}
      />
    </Animated.View>
  );
}

function Chip({
  label,
  colour,
  on,
  idle,
  active,
  ink,
  onPress,
}: {
  readonly label: string;
  readonly colour: string;
  readonly on: boolean;
  readonly idle: string;
  readonly active: string;
  readonly ink: string;
  readonly onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(on ? 1 : 0);
  const pressed = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(on ? 1 : 0, { duration: reduceMotion ? 0 : SELECT_MS, easing: ease });
  }, [on, p, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [idle, active]),
    transform: [{ scale: 1 - 0.05 * pressed.value }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: durations.tap / 2, easing: enter });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: durations.tap * 2, easing: enter });
      }}
    >
      <Animated.View
        style={[
          {
            height: 32,
            paddingLeft: 10,
            paddingRight: 12,
            borderRadius: 99,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
          },
          style,
        ]}
      >
        <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: colour }} />
        <Text style={{ ...body(13, 600), color: ink }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * "Money in this month": the stacked money river (Bills, Future you, Occasions, Spent, Free) and
 * its legend. Tapping a colour or a chip selects that segment: the others dim, it stands taller,
 * and the header tells what it holds. Widths follow the numbers with the entrance curve.
 */
export function MoneyRiverCard({
  income,
  river,
  colours,
  copy,
}: {
  readonly income: Vnd;
  readonly river: Readonly<Record<RiverSegment, Vnd>>;
  readonly colours: PlanColours;
  readonly copy: RiverCopy;
}) {
  const { palette } = useTheme();
  const [selected, setSelected] = useState<RiverSegment | null>(null);
  const pick = (id: RiverSegment) => {
    haptics.tick();
    setSelected((current) => (current === id ? null : id));
  };
  const label = selected ? copy.label[selected] : copy.total;
  const value = formatShort(selected ? river[selected] : income);
  const note = selected ? copy.note[selected] : copy.hint;
  return (
    <PlanCard padding={{ top: 18, side: 18, bottom: 18 }} gap={16}>
      <Animated.View
        key={selected ?? 'all'}
        entering={FadeIn.duration(SELECT_MS)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          minHeight: 62,
        }}
      >
        <View style={{ gap: 4 }}>
          <Text style={{ ...body(13, 600), color: palette.inkSoft }}>{label}</Text>
          <Text style={{ ...display(44, 500, -0.03), lineHeight: 44, color: palette.ink }}>
            {value}
          </Text>
        </View>
        <Text
          style={{
            ...body(13),
            lineHeight: 18.2,
            color: palette.inkSoft,
            textAlign: 'right',
            maxWidth: 150,
            flexShrink: 1,
          }}
        >
          {note}
        </Text>
      </Animated.View>
      <View style={{ flexDirection: 'row', height: 46, gap: 3 }}>
        {RIVER_SEGMENTS.map((id, k) => (
          <Segment
            key={id}
            index={k}
            amount={river[id]}
            colour={colours.river[id]}
            label={`${copy.label[id]} ${formatShort(river[id])}`}
            state={selected === null ? 'none' : selected === id ? 'on' : 'off'}
            onPress={() => pick(id)}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {RIVER_SEGMENTS.map((id) => (
          <Chip
            key={id}
            label={copy.label[id]}
            colour={colours.river[id]}
            on={selected === id}
            idle={palette.chipBg}
            active={colours.chipOn}
            ink={palette.ink}
            onPress={() => pick(id)}
          />
        ))}
      </View>
    </PlanCard>
  );
}
