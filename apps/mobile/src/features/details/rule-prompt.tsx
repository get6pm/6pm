import { Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** "Always file Circle K as Food?" — offered after the category of a spend is changed. */
export function RulePrompt({
  text,
  once,
  always,
  onOnce,
  onAlways,
}: {
  readonly text: string;
  readonly once: string;
  readonly always: string;
  readonly onOnce: () => void;
  readonly onAlways: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={{
        alignSelf: 'stretch',
        marginTop: 12,
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 12,
        borderRadius: 20,
        backgroundColor: palette.chipBg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Symbol name="auto_awesome" size={22} color={palette.accent} />
      <Text style={{ ...body(14, 550), lineHeight: 18, color: palette.ink, flex: 1 }}>{text}</Text>
      <PressScale
        onPress={onOnce}
        style={{ height: 32, paddingHorizontal: 10, justifyContent: 'center' }}
      >
        <Text style={{ ...body(13, 600), color: palette.inkSoft }}>{once}</Text>
      </PressScale>
      <PressScale
        onPress={() => {
          haptics.tap();
          onAlways();
        }}
        style={{
          height: 32,
          paddingHorizontal: 12,
          borderRadius: 99,
          backgroundColor: palette.btnBg,
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(13, 650), color: palette.btnFg }}>{always}</Text>
      </PressScale>
    </Animated.View>
  );
}
