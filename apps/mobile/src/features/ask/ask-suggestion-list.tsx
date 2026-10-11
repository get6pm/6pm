import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { riseIn } from './ask-motion';

/** "Try": the suggested questions as outlined rows, shown until the first question is asked. */
export function AskSuggestionList({
  suggestions,
  onPick,
}: {
  readonly suggestions: readonly string[];
  readonly onPick: (question: string) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <Animated.View entering={riseIn} style={{ gap: 8, paddingTop: 6 }}>
      <Text
        style={{
          ...body(12, 600, 0.05),
          paddingHorizontal: 4,
          textTransform: 'uppercase',
          color: palette.inkSoft,
        }}
      >
        {t('ask.try')}
      </Text>
      {suggestions.map((label) => (
        <PressScale
          key={label}
          accessibilityRole="button"
          onPress={() => onPick(label)}
          style={{
            alignSelf: 'flex-start',
            minHeight: 44,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: palette.hair,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Symbol name="north_east" size={18} color={palette.accent} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ ...body(15, 500), color: palette.ink }}>{label}</Text>
          </View>
        </PressScale>
      ))}
    </Animated.View>
  );
}
