import { useRouter } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { Switch } from '../../ui/primitives/switch';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useTravel } from './travel-provider';

/** The prototype's MAX lock beside a locked feature's name: ink chip, filled lock, letter-spaced. */
function MaxLock() {
  const { palette } = useTheme();
  return (
    <View
      style={{
        height: 20,
        paddingLeft: 5,
        paddingRight: 7,
        borderRadius: 6,
        backgroundColor: palette.ink,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Symbol name="lock" size={12} fill={1} color={palette.sheetSolid} />
      <Text style={{ ...body(10, 800, 0.1), color: palette.sheetSolid }}>MAX</Text>
    </View>
  );
}

/**
 * The last row of "Your day" (`App:825-829`): Travel mode, "Turns on by itself abroad", and its
 * switch. Without Max the switch opens the Max sheet. Under the name it says when location is off
 * (tapping opens iOS Settings) and when the rates are old or not there yet.
 */
export function TravelRow() {
  const { palette } = useTheme();
  const { t, dayMonth } = useI18n();
  const router = useRouter();
  const { on, locked, access, trip, setOn } = useTravel();
  const locationOff = on && access === 'denied';
  const sub = locationOff
    ? t('travel.settings.locationOff')
    : trip !== null && trip.rate === null
      ? t('travel.settings.noRates')
      : trip?.rate && trip.stale
        ? t('travel.settings.stale', { date: dayMonth(new Date(`${trip.rate.asOf}T00:00:00`)) })
        : t('travel.settings.sub');

  return (
    <PressScale
      scaleTo={1}
      disabled={!locationOff}
      onPress={() => {
        haptics.tick();
        void Linking.openSettings();
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: palette.chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="flight" size={19} color={palette.ink} />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 11,
          borderTopWidth: 0.5,
          borderTopColor: palette.hair,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ ...body(16), color: palette.ink }}>{t('travel.settings.label')}</Text>
            {locked && !on ? <MaxLock /> : null}
          </View>
          <Text numberOfLines={1} style={{ ...body(12.5), color: palette.inkSoft }}>
            {sub}
          </Text>
        </View>
        <Switch
          value={on}
          accessibilityLabel={t('travel.settings.label')}
          onChange={(next) => {
            if (next && locked) {
              router.push({ pathname: '/max', params: { from: 'travel' } });
              return;
            }
            setOn(next);
          }}
        />
      </View>
    </PressScale>
  );
}
