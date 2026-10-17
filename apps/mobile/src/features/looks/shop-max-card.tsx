import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { paletteFor, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { anyTrialDays, quotedOffer } from '../purchases/max-pricing';
import { useMaxStatusLine } from '../purchases/use-max-status-line';
import { CLASSIC_LOOKS, PAID_LOOKS } from '../purchases/products';
import type { CustomerState, Offerings } from '../purchases/purchases-port';
import { MAX_FONT, MAX_INK } from '../purchases/max-colours';

/**
 * The shop's Max card (prototype `App:872-889`): the six classic skies as bands, the promise, and
 * what Max costs, read from the store. A price or a trial the store has not told us is left out.
 */
export function ShopMaxCard({
  customer,
  offerings,
  hour,
  configs,
  onPress,
}: {
  readonly customer: CustomerState;
  readonly offerings: Offerings | null;
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const on = customer.max.active;
  const statusLine = useMaxStatusLine(customer);
  const bands = useMemo(
    () =>
      CLASSIC_LOOKS.map((look) => {
        const { st } = paletteFor({ look, hour, serious: false, config: configs[look] ?? {} });
        return `linear-gradient(180deg, ${st[0]}, ${st[1]} 55%, ${st[2]})`;
      }),
    [hour, configs],
  );

  const trial = offerings ? anyTrialDays(offerings) : null;
  const quoted = offerings ? quotedOffer(offerings) : null;
  const priceLine = on
    ? statusLine
    : [
        trial === null ? null : t('looks.maxCard.trial', { count: trial }),
        quoted === null
          ? null
          : quoted.plan === 'yearly'
            ? t('looks.maxCard.year', { price: quoted.priceText })
            : t('looks.maxCard.month', { price: quoted.priceText }),
      ]
        .filter((part): part is string => part !== null)
        .join(' · ');

  return (
    <PressScale
      accessibilityRole="button"
      scaleTo={0.98}
      onPress={onPress}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: MAX_INK,
        boxShadow: palette.cardShadow,
        paddingTop: 18,
        paddingHorizontal: 18,
        paddingBottom: 16,
        gap: 14,
      }}
    >
      {bands.map((image, i) => (
        <View
          key={CLASSIC_LOOKS[i]}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '17%',
            // The prototype spreads the bands edge to edge: band i sits at i/(n-1) of the free width.
            left: `${((i * 100) / (bands.length - 1)) * 0.83}%`,
            backgroundImage: image,
          }}
        />
      ))}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'linear-gradient(180deg, rgba(8,6,14,.3), rgba(8,6,14,.85))',
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ ...leading(display(26, 700, -0.02, MAX_FONT), 26), color: '#ffffff' }}>
            6pm
          </Text>
          <View
            style={{
              height: 22,
              paddingHorizontal: 8,
              borderRadius: 7,
              backgroundColor: '#ffffff',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(12, 800, 0.1), color: MAX_INK }}>MAX</Text>
          </View>
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
          <Symbol name="auto_awesome" size={14} fill={1} color="#ffffff" />
          <Text style={{ ...body(11.5, 700), color: '#ffffff' }}>
            {on ? t('looks.maxCard.badgeOn') : t('looks.maxCard.badge')}
          </Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ ...body(19, 700, -0.01), lineHeight: 22.8, color: '#ffffff' }}>
          {t('looks.maxCard.title')}
        </Text>
        <Text style={{ ...body(13), lineHeight: 18.2, color: '#ffffff', opacity: 0.82 }}>
          {on ? t('looks.maxCard.subOn') : t('looks.maxCard.sub', { count: PAID_LOOKS.length })}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text style={{ ...body(13), flex: 1, color: '#ffffff', opacity: 0.85 }}>{priceLine}</Text>
        <View
          style={{
            height: 38,
            paddingHorizontal: 16,
            borderRadius: 99,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(14, 700), color: MAX_INK }}>
            {on ? t('looks.maxCard.ctaOn') : t('looks.maxCard.cta')}
          </Text>
        </View>
      </View>
    </PressScale>
  );
}
