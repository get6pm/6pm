import { Text, View } from 'react-native';

import type { LookConfig, LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { MaxGlow } from '../purchases/max-glow';
import { anyTrialDays, quotedOffer } from '../purchases/max-pricing';
import { useMaxStatusLine } from '../purchases/use-max-status-line';
import type { CustomerState, Offerings } from '../purchases/purchases-port';
import { MAX_CREAM, MAX_FONT, MAX_INK, MAX_PAGE } from '../purchases/max-colours';

/**
 * The shop's Max card (prototype `App:947-958`): the paid skies blurred behind the wordmark, the
 * promise in the look's face, and what Max costs as the store says it. A price or a trial the
 * store has not told us is left out.
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
  const trial = offerings ? anyTrialDays(offerings) : null;
  const quoted = offerings ? quotedOffer(offerings) : null;
  const line = on
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
      scaleTo={0.985}
      onPress={onPress}
      style={{
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: MAX_PAGE,
        boxShadow: palette.cardShadow,
        paddingTop: 18,
        paddingHorizontal: 18,
        paddingBottom: 16,
        gap: 14,
      }}
    >
      <MaxGlow hour={hour} configs={configs} blur={34} saturation={1.3} opacity={0.55} inset={40} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'linear-gradient(180deg, rgba(15,12,20,.25), rgba(15,12,20,.8))',
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ ...leading(display(22, 700, -0.02, MAX_FONT), 22), color: MAX_CREAM }}>
            6pm
          </Text>
          <View
            style={{
              height: 20,
              paddingHorizontal: 7,
              borderRadius: 6,
              backgroundColor: MAX_CREAM,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(11, 800, 0.1), color: MAX_INK }}>MAX</Text>
          </View>
        </View>
        <View
          style={{
            height: 24,
            paddingHorizontal: 10,
            borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,.14)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Symbol name="auto_awesome" size={14} fill={1} color={MAX_CREAM} />
          <Text style={{ ...body(11.5, 700), color: MAX_CREAM }}>
            {on ? t('looks.maxCard.badgeOn') : t('looks.maxCard.badge')}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flexShrink: 1, gap: 3 }}>
          <Text style={{ ...leading(display(24, 500, -0.01), 25.2), color: MAX_CREAM }}>
            {t('looks.maxCard.title')}
          </Text>
          {line ? (
            <Text style={{ ...body(13), lineHeight: 18.2, color: 'rgba(246,239,230,.82)' }}>
              {line}
            </Text>
          ) : null}
        </View>
        <View
          style={{
            height: 40,
            paddingHorizontal: 16,
            borderRadius: 99,
            backgroundColor: MAX_CREAM,
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
