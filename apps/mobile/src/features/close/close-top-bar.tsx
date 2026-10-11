import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { GlassButton } from '../../ui/primitives/glass-button';
import { useTheme } from '../../ui/theme/theme';
import { mono } from '../../ui/type/fonts';

function Dot({ index, current }: { readonly index: number; readonly current: number }) {
  const { palette } = useTheme();
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(index <= current ? 1 : 0.22, { duration: 400 }),
    backgroundColor: withTiming(index === current ? palette.accent : palette.ink, {
      duration: 400,
    }),
  }));
  return <Animated.View style={[{ flex: 1, height: 3, borderRadius: 3 }, style]} />;
}

/** The close's top bar: the way out, the five-step bar and the current step's name. */
export function CloseTopBar({
  keys,
  index,
  of,
  label,
  closeLabel,
  onClose,
}: {
  readonly keys: readonly string[];
  /** 1-based position of the current step. */
  readonly index: number;
  readonly of: number;
  readonly label: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 44 }}>
      <GlassButton icon="close" label={closeLabel} onPress={onClose} />
      <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
        {keys.map((key, i) => (
          <Dot key={key} index={i} current={index - 1} />
        ))}
      </View>
      <Text
        style={{ ...mono(11, 400, 0.14), color: palette.inkSoft, minWidth: 64, textAlign: 'right' }}
      >
        {label} · {index}/{of}
      </Text>
    </View>
  );
}
