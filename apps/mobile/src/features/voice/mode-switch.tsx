import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

export type EntryMode = 'keys' | 'voice';

const slide = Easing.bezier(...curves.house);
const SLIDE_MS = 320;

interface Span {
  readonly x: number;
  readonly width: number;
}

/**
 * Keypad | Voice in Quick add's header: a pill whose white thumb slides under the picked mode with
 * the house curve.
 */
export function ModeSwitch({
  value,
  labels,
  onChange,
}: {
  readonly value: EntryMode;
  readonly labels: Readonly<Record<EntryMode, string>>;
  readonly onChange: (mode: EntryMode) => void;
}) {
  const { palette } = useTheme();
  const [spans, setSpans] = useState<Partial<Record<EntryMode, Span>>>({});
  const span = spans[value];
  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const placed = useSharedValue(0);
  useEffect(() => {
    if (!span) return;
    // The first measure places the thumb; after that it slides.
    if (placed.value === 0) {
      left.value = span.x;
      width.value = span.width;
      placed.value = 1;
      return;
    }
    left.value = withTiming(span.x, { duration: SLIDE_MS, easing: slide });
    width.value = withTiming(span.width, { duration: SLIDE_MS, easing: slide });
  }, [span, left, width, placed]);
  const thumb = useAnimatedStyle(() => ({
    opacity: placed.value,
    left: left.value,
    width: width.value,
  }));
  const modes: readonly EntryMode[] = ['keys', 'voice'];
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        padding: 3,
        borderRadius: 99,
        backgroundColor: palette.chipBg,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 3,
            bottom: 3,
            borderRadius: 99,
            backgroundColor: palette.dark ? 'rgba(255,255,255,.2)' : '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.12)',
          },
          thumb,
        ]}
      />
      {modes.map((mode) => (
        <Pressable
          key={mode}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === value }}
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            setSpans((s) => ({ ...s, [mode]: { x, width } }));
          }}
          onPress={() => {
            if (mode === value) return;
            haptics.tick();
            onChange(mode);
          }}
          style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 99 }}
        >
          <Text style={{ ...body(13, 600), color: palette.ink }}>{labels[mode]}</Text>
        </Pressable>
      ))}
    </View>
  );
}
