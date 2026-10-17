import { ActivityIndicator, Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import type { MaxPlan } from './products';
import type { Offerings } from './purchases-port';
import { MAX_CREAM, MAX_INK } from './max-colours';

/**
 * The Max sheet's pinned bottom (prototype `App:1050-1062`): the yearly / monthly choice with the
 * store's own figures, the one button, the terms line, and Manage once Max is on.
 */
export function MaxFooter({
  on,
  plan,
  offerings,
  saving,
  cta,
  ctaOff,
  busy,
  terms,
  onPlan,
  onStart,
  onManage,
}: {
  readonly on: boolean;
  readonly plan: MaxPlan;
  readonly offerings: Offerings | null;
  /** The yearly saving in whole percent, when the store's two prices say there is one. */
  readonly saving: number | null;
  readonly cta: string;
  readonly ctaOff: boolean;
  readonly busy: boolean;
  readonly terms: string;
  readonly onPlan: (plan: MaxPlan) => void;
  readonly onStart: () => void;
  readonly onManage: () => void;
}) {
  const { t } = useI18n();
  const { bottom } = useDesignInsets();
  return (
    <View
      style={{
        marginTop: -28,
        paddingTop: 28,
        paddingHorizontal: 16,
        paddingBottom: bottom(26),
        gap: 10,
        backgroundImage: 'linear-gradient(180deg, rgba(15,12,20,0) 0%, #0f0c14 30%)',
      }}
    >
      {!on ? (
        <View
          accessibilityRole="radiogroup"
          style={{
            flexDirection: 'row',
            gap: 4,
            padding: 4,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,.07)',
          }}
        >
          {(['yearly', 'monthly'] as const).map((p) => {
            const selected = p === plan;
            // The billed amount is the tile's big figure (App Store guideline 3.1.2(c)).
            const price = offerings?.max[p]?.priceText ?? null;
            return (
              <PressScale
                key={p}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                scaleTo={0.97}
                onPress={() => {
                  haptics.tick();
                  onPlan(p);
                }}
                style={{
                  flex: 1,
                  height: 54,
                  borderRadius: 14,
                  backgroundColor: selected ? MAX_CREAM : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Text
                  style={{
                    ...body(11.5, 700, 0.04),
                    color: selected ? MAX_INK : MAX_CREAM,
                    opacity: 0.75,
                  }}
                >
                  {p === 'monthly'
                    ? t('max.plan.monthly')
                    : saving !== null
                      ? t('max.plan.yearlySave', { percent: saving })
                      : t('max.plan.yearly')}
                </Text>
                <Text
                  style={{
                    ...body(16, 700),
                    minHeight: 19,
                    color: selected ? MAX_INK : MAX_CREAM,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {price === null
                    ? ''
                    : p === 'yearly'
                      ? t('max.perYear', { price })
                      : t('max.perMonth', { price })}
                </Text>
              </PressScale>
            );
          })}
        </View>
      ) : null}
      <PressScale
        accessibilityRole="button"
        scaleTo={0.97}
        disabled={ctaOff}
        onPress={onStart}
        style={{
          height: 56,
          borderRadius: 18,
          backgroundColor: MAX_CREAM,
          opacity: ctaOff && !busy ? 0.5 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
        }}
      >
        {busy ? <ActivityIndicator color={MAX_INK} /> : null}
        <Text style={{ ...body(17, 700), color: MAX_INK }}>{cta}</Text>
      </PressScale>
      {terms ? (
        <Text
          style={{
            ...body(12),
            lineHeight: 16.2,
            textAlign: 'center',
            color: 'rgba(246,239,230,.55)',
          }}
        >
          {terms}
        </Text>
      ) : null}
      {on ? (
        <PressScale
          accessibilityRole="button"
          scaleTo={0.97}
          onPress={onManage}
          style={{ height: 34, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ ...body(13.5, 600), color: MAX_CREAM, textDecorationLine: 'underline' }}>
            {t('max.manage')}
          </Text>
        </PressScale>
      ) : null}
    </View>
  );
}
