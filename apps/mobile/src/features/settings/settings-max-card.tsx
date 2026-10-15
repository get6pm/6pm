import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { oklchSrgbHex, paletteFor } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { useLookSettings } from '../looks/look-settings-provider';
import { MAX_CREAM, MAX_FONT, MAX_INK } from '../purchases/max-colours';
import { PAID_LOOKS } from '../purchases/products';
import { usePurchases } from '../purchases/purchases-provider';
import { useMaxStatusLine } from '../purchases/use-max-status-line';

const MEMBER_DOT = oklchSrgbHex(0.8, 0.15, 150);

/** The nine paid skies at this hour as side-by-side bands, as the prototype's `maxHeroImg`. */
function SkyBands() {
  const { hour } = useClock();
  const { config } = useLookSettings();
  const bands = useMemo(
    () =>
      PAID_LOOKS.map((look) => {
        const { st } = paletteFor({ look, hour, serious: false, config: config[look] ?? {} });
        return `linear-gradient(180deg, ${st[0]}, ${st[1]} 55%, ${st[2]})`;
      }),
    [hour, config],
  );
  return bands.map((image, i) => (
    <View
      key={PAID_LOOKS[i]}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '11.2%',
        // background-position i/(n-1): each band sits at that share of the free width.
        left: `${((i * 100) / (bands.length - 1)) * 0.888}%`,
        experimental_backgroundImage: image,
      }}
    />
  ));
}

function MaxBadge({ size }: { readonly size: 'card' | 'tile' }) {
  const card = size === 'card';
  return (
    <View
      style={{
        height: card ? 21 : 16,
        paddingHorizontal: card ? 7 : 4,
        borderRadius: card ? 6 : 4,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
      }}
    >
      <Text style={{ ...body(card ? 11.5 : 8.5, 800, card ? 0.12 : 0.1), color: MAX_INK }}>
        MAX
      </Text>
    </View>
  );
}

/**
 * The top of Settings: a member sees the dark Max card with when it renews; everyone else a cell
 * with the skies tile and "Try 6pm Max free". Both open the Max sheet.
 */
export function SettingsMaxCard({ onPress }: { readonly onPress: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { customer } = usePurchases();
  const status = useMaxStatusLine(customer);

  if (customer.max.active) {
    return (
      <PressScale
        accessibilityRole="button"
        scaleTo={0.98}
        inScroll
        onPress={onPress}
        style={{
          borderRadius: 26,
          overflow: 'hidden',
          backgroundColor: MAX_INK,
          boxShadow: palette.cardShadow,
          paddingTop: 16,
          paddingHorizontal: 16,
          paddingBottom: 15,
          gap: 14,
        }}
      >
        <SkyBands />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            experimental_backgroundImage:
              'linear-gradient(115deg, rgba(10,8,16,.82) 30%, rgba(10,8,16,.35))',
          }}
        />
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ ...leading(display(24, 700, -0.02, MAX_FONT), 24), color: '#ffffff' }}>
              6pm
            </Text>
            <MaxBadge size="card" />
          </View>
          <View
            style={{
              height: 24,
              paddingHorizontal: 10,
              borderRadius: 99,
              backgroundColor: 'rgba(255,255,255,.16)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: MEMBER_DOT }} />
            <Text style={{ ...body(11.5, 700), color: '#ffffff' }}>{t('settings.maxMember')}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ ...body(13), flex: 1, color: MAX_CREAM, opacity: 0.85 }}>{status}</Text>
          <Symbol name="chevron_right" size={20} color="#ffffff" style={{ opacity: 0.6 }} />
        </View>
      </PressScale>
    );
  }

  return (
    <PressScale
      accessibilityRole="button"
      scaleTo={0.98}
      inScroll
      onPress={onPress}
      style={{
        borderRadius: 22,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: MAX_INK,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SkyBands />
        <MaxBadge size="tile" />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ ...body(16, 650), color: palette.ink }}>{t('settings.maxTry')}</Text>
        <Text numberOfLines={1} style={{ ...body(12.5), color: palette.inkSoft }}>
          {t('settings.maxTrySub')}
        </Text>
      </View>
      <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
    </PressScale>
  );
}
