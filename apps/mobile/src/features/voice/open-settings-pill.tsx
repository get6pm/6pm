import { Linking, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { glide } from './glide';

/** Offered when the microphone or speech recognition is off: iOS asks only once. */
export function OpenSettingsPill() {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <Animated.View entering={FadeIn.duration(300)} layout={glide}>
      <PressScale
        onPress={() => void Linking.openSettings()}
        style={{
          height: 36,
          paddingHorizontal: 14,
          borderRadius: 99,
          backgroundColor: palette.glass,
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(14, 600), color: palette.ink }}>{t('voice.openSettings')}</Text>
      </PressScale>
    </Animated.View>
  );
}
