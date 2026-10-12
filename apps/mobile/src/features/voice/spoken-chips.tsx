import { Text, View } from 'react-native';
import Animated, { withSpring, withTiming } from 'react-native-reanimated';

import { springs } from '@6pm/theme';

import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** The prototype's `rise .3s`: the row comes up 14 pt into place while fading in, on a spring. */
function rise() {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 14 }] },
    animations: {
      opacity: withTiming(1, { duration: 300 }),
      transform: [{ translateY: withSpring(0, springs.settle) }],
    },
  };
}

/** What was read from the words: name, amount, category, as small pills. */
export function SpokenChips({ chips }: { readonly chips: readonly string[] }) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={rise}
      style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}
    >
      {chips.map((chip, i) => (
        <View
          key={`${i}-${chip}`}
          style={{
            height: 30,
            paddingHorizontal: 12,
            borderRadius: 99,
            backgroundColor: palette.chipBg,
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(13, 600), color: palette.ink }}>{chip}</Text>
        </View>
      ))}
    </Animated.View>
  );
}
