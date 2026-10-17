import { Text, useWindowDimensions, View } from 'react-native';

import { configFor, lookById, swatchesFor } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { useLookCardLines } from '../looks/look-card-lines';
import { LookSkyPreview } from '../looks/look-sky-preview';
import { useLookSettings } from '../looks/look-settings-provider';
import { resolveLook } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';

/** The card's sky band, and where in the screen's sky it looks: the sign, the date and the clock. */
const SKY_HEIGHT = 150;
const SKY_LIFT = 175;
/** Settings' rows sit 16 pt in from each side. */
const SIDE = 16;

/**
 * The look in use (prototype `App:794-810`): a band of its real sky, as the Looks shop's cards
 * draw it, with the date, the clock and the "In use" badge; then "LOOK", its name in its face,
 * three swatches of its variant and "Saigon · 7 more in the shop". Opens the Looks shop.
 */
export function SettingsLookCard({ onPress }: { readonly onPress: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { hour } = useClock();
  const { width } = useWindowDimensions();
  const { customer } = useEntitlement();
  const { look, config } = useLookSettings();
  const { name, line } = useLookCardLines();
  const worn = resolveLook(look, customer);
  const lookConfig = config[worn];
  const swatches = swatchesFor(worn, configFor(worn, lookConfig).v).slice(0, 3);

  return (
    <PressScale
      inScroll
      accessibilityRole="button"
      accessibilityLabel={`${t('settings.look')}: ${name}`}
      scaleTo={0.98}
      onPress={onPress}
      style={{
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <View style={{ height: SKY_HEIGHT }}>
        <LookSkyPreview
          look={worn}
          hour={hour}
          config={lookConfig}
          width={width - SIDE * 2}
          height={SKY_HEIGHT}
          running={false}
          lift={SKY_LIFT}
        />
        <View
          style={{
            position: 'absolute',
            left: 14,
            top: 12,
            height: 22,
            paddingHorizontal: 9,
            borderRadius: 99,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(11, 700), color: '#16131c' }}>{t('looks.badge.inUse')}</Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: 13,
          paddingLeft: 16,
          paddingRight: 14,
          paddingBottom: 14,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text
            style={{ ...body(12, 600, 0.05), textTransform: 'uppercase', color: palette.inkSoft }}
          >
            {t('settings.look')}
          </Text>
          <Text
            style={{
              ...leading(display(23, 500, 0, lookById(worn).font), 25.3),
              color: palette.ink,
            }}
          >
            {name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <View style={{ flexDirection: 'row' }}>
              {swatches.map((colour, i) => (
                <View
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    marginLeft: i === 0 ? 0 : -4,
                    backgroundColor: colour,
                    boxShadow: `0 0 0 1.5px ${palette.cell}`,
                  }}
                />
              ))}
            </View>
            <Text numberOfLines={1} style={{ ...body(13), flex: 1, color: palette.inkSoft }}>
              {line}
            </Text>
          </View>
        </View>
        <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
      </View>
    </PressScale>
  );
}
