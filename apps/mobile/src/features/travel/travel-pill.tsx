import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { planInk } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useTravel } from './travel-provider';

/**
 * Under the date on Today while a trip is under way (`App:130`): "Bangkok · ฿ with ₫ underneath"
 * on the look's accent. It opens Settings, where the switch is.
 */
export function TravelPill() {
  const { trip } = useTravel();
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  if (trip === null) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(150)}
      style={{ marginTop: 6, alignSelf: 'flex-start' }}
    >
      <PressScale
        accessibilityRole="button"
        onPress={() => {
          haptics.tick();
          router.push('/settings');
        }}
        style={{
          height: 26,
          paddingLeft: 8,
          paddingRight: 10,
          borderRadius: 99,
          backgroundColor: palette.accent,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Symbol name="flight" size={15} color={planInk.onAccent} />
        <Text style={{ ...body(12, 700), color: planInk.onAccent }}>
          {t('travel.pill', { place: trip.place.name, symbol: trip.currency.symbol })}
        </Text>
      </PressScale>
    </Animated.View>
  );
}
