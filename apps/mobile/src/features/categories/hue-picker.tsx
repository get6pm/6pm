import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { oklchSrgbHex } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { CATEGORY_HUES } from './icon-packs';

/** A 32 pt swatch; the chosen one wears a 2 pt ink ring 2.5 pt out, fading in over 0.2 s. */
function Swatch({
  hue,
  selected,
  label,
  onPick,
}: {
  readonly hue: number;
  readonly selected: boolean;
  readonly label: string;
  readonly onPick: (hue: number) => void;
}) {
  const { palette } = useTheme();
  const on = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [on, selected]);
  const ring = useAnimatedStyle(() => ({ opacity: on.value }));
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => {
        haptics.tick();
        onPick(hue);
      }}
      hitSlop={4}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: oklchSrgbHex(0.78, 0.12, hue),
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            inset: -4.5,
            borderRadius: 20.5,
            borderWidth: 2,
            borderColor: palette.ink,
          },
          ring,
        ]}
      />
    </PressScale>
  );
}

/** The editor's eight colours, spread across the card. */
export const HuePicker = memo(function HuePicker({
  hue,
  label,
  onPick,
}: {
  readonly hue: number;
  /** Read out for every swatch ("Colour"). */
  readonly label: string;
  readonly onPick: (hue: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
        paddingHorizontal: 4,
      }}
    >
      {CATEGORY_HUES.map((h) => (
        <Swatch key={h} hue={h} selected={h === hue} label={label} onPick={onPick} />
      ))}
    </View>
  );
});
