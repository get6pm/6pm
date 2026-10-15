import { Text, View } from 'react-native';

import { lookById, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import type { LookOffer } from '../purchases/purchases-port';
import { useLookPreview, LookPreview, SHOP_PREVIEW } from './look-preview';
import { isScene, type CardBadge } from './look-catalogue';
import type { LookCopy } from './look-copy';

/** The prototype's badge colours: white for the look in use, dark for one that is yours, the look's accent otherwise. */
function badgeColours(badge: CardBadge, accent: string) {
  if (badge === 'inUse') return { bg: '#ffffff', fg: '#16131c' };
  if (badge === 'price') return { bg: accent, fg: '#1d1220' };
  return { bg: 'rgba(10,8,16,.55)', fg: '#ffffff' };
}

/** One look in the shop: its live-drawn preview with a badge, its name in its own face, and its tag. */
export function LookCard({
  look,
  badge,
  offer,
  hour,
  config,
  safe,
  copy,
  onPress,
}: {
  readonly look: LookId;
  readonly badge: CardBadge;
  /** The store's price for a look that is not yet the customer's; none until the store answers. */
  readonly offer: LookOffer | undefined;
  readonly hour: number;
  readonly config: Partial<LookConfig> | undefined;
  readonly safe: string;
  readonly copy: LookCopy;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const def = lookById(look);
  const { palette: own } = useLookPreview(look, hour, config);
  const colours = badgeColours(badge, own.accent);
  const label =
    badge === 'inUse'
      ? t('looks.badge.inUse')
      : badge === 'free'
        ? t('looks.badge.free')
        : badge === 'max'
          ? t('looks.badge.max')
          : badge === 'owned'
            ? t('looks.badge.owned')
            : (offer?.priceText ?? null);
  const name = copy.name(look);
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={name}
      scaleTo={0.97}
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <View style={{ height: isScene(look) ? 180 : 158 }}>
        <LookPreview
          look={look}
          hour={hour}
          config={config}
          safe={safe}
          label={t('looks.safeToday')}
          metrics={SHOP_PREVIEW}
        >
          {label ? (
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                height: 22,
                paddingHorizontal: 9,
                borderRadius: 99,
                backgroundColor: colours.bg,
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(11, 700), color: colours.fg }}>{label}</Text>
            </View>
          ) : null}
        </LookPreview>
      </View>
      <View style={{ paddingTop: 11, paddingHorizontal: 12, paddingBottom: 13, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{ ...leading(display(18, 500, 0, def.font), 20.7, true), color: palette.ink }}
        >
          {name}
        </Text>
        <Text numberOfLines={2} style={{ ...body(12), lineHeight: 16.2, color: palette.inkSoft }}>
          {copy.tag(look)}
        </Text>
      </View>
    </PressScale>
  );
}
