import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { configFor, lookById, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import type { ScrollDismiss } from '../../ui/motion/use-sheet-drag';
import { PressScale } from '../../ui/primitives/press-scale';
import { useToast } from '../../ui/toast/toast-host';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { useCompanionToast } from '../companion/use-companion-toast';
import { canUseLook, lookAccess, resolveLook } from '../purchases/entitlement';
import { isPaidLook } from '../purchases/products';
import { usePurchases } from '../purchases/purchases-provider';
import { cardBadge, positionOf, tierOf } from './look-catalogue';
import { lookCopy } from './look-copy';
import { DetailHeader, EffectChips } from './look-detail-parts';
import { useLookSettings, useLookSettingsStore } from './look-settings-provider';
import { IntensitySlider } from './intensity-slider';
import { VariantPicker } from './variant-picker';

/**
 * A look being tried on (prototype `App:970-1009`), in the lower part of the Looks sheet while
 * the real app above wears it: its shelf and name, its palettes, its intensity and its effects,
 * then Use or Buy pinned at the bottom. The settings save as they change; nothing is worn until
 * Use. `grab` wraps the top row, which drags the sheet.
 */
export function LookDetail({
  look,
  onBack,
  onStep,
  onDone,
  grab,
  scroll,
}: {
  readonly look: LookId;
  readonly onBack: () => void;
  readonly onStep: (step: 1 | -1) => void;
  /** The look is worn: the sheet goes. */
  readonly onDone: () => void;
  readonly grab: (header: ReactNode) => ReactNode;
  /** The scroll pulls the sheet down from its top. */
  readonly scroll: ScrollDismiss;
}) {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const say = useCompanionToast();
  const { bottom } = useDesignInsets();
  const { customer, offerings, offeringsStatus, busy, buy } = usePurchases();
  const { look: chosen, config } = useLookSettings();
  const store = useLookSettingsStore();
  const copy = useMemo(() => lookCopy(t), [t]);
  const def = lookById(look);
  const settings = configFor(look, config[look]);
  const access = lookAccess(look, customer);
  const owned = access !== 'locked';
  const worn = resolveLook(chosen, customer);
  const offer = isPaidLook(look) ? offerings?.looks[look] : undefined;
  const badge = cardBadge(look, worn, customer);
  const [shownK, setShownK] = useState(settings.k);
  useEffect(() => setShownK(settings.k), [settings.k]);

  const wear = () => {
    if (!store.setLook(look, (id) => canUseLook(id, customer))) return;
    haptics.tap();
    say('lookSet');
    onDone();
  };

  const purchase = async () => {
    if (!offer) return;
    haptics.tap();
    const outcome = await buy(offer.productId);
    if (outcome.kind === 'purchased') {
      store.setLook(look, (id) => canUseLook(id, outcome.customer));
      haptics.success();
      say('lookNew');
      onDone();
    } else if (outcome.kind === 'failed') {
      toast(t('look.buyFailed'));
    }
  };

  const badgeText =
    badge === 'inUse'
      ? t('looks.badge.inUse')
      : badge === 'free'
        ? t('looks.badge.free')
        : badge === 'max'
          ? t('looks.badge.max')
          : badge === 'owned'
            ? t('looks.badge.owned')
            : (offer?.priceText ?? null);
  const badgeBg = badge === 'inUse' ? palette.ink : owned ? palette.chipBg : palette.accent;
  const badgeFg = badge === 'inUse' ? palette.sheetSolid : owned ? palette.ink : '#1d1220';

  const ctaLabel = owned
    ? worn === look
      ? t('look.keep')
      : t('look.use')
    : offer
      ? t('look.buy', { price: offer.priceText })
      : t('look.buyNoPrice');
  const ctaDisabled = busy || (!owned && !offer);
  const note = owned
    ? t('look.noteOwned')
    : offeringsStatus === 'unavailable'
      ? t('look.noteStoreOff')
      : null;

  return (
    <View style={{ flex: 1 }}>
      {grab(<DetailHeader position={positionOf(look)} onBack={onBack} onStep={onStep} />)}

      <GestureDetector gesture={scroll.gesture}>
        <Animated.ScrollView
          ref={scroll.ref}
          onScroll={scroll.onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 12,
            paddingHorizontal: 18,
            paddingBottom: 10,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text
                numberOfLines={1}
                style={{
                  ...body(11.5, 600, 0.08),
                  textTransform: 'uppercase',
                  color: palette.inkSoft,
                }}
              >
                {t('look.tryingOn', { tier: t(`look.tier.${tierOf(look)}`) })}
              </Text>
              <Text
                accessibilityRole="header"
                style={{
                  ...leading(display(34, 500, -0.015, def.font), 34, true),
                  color: palette.ink,
                }}
              >
                {copy.name(look)}
              </Text>
            </View>
            {badgeText ? (
              <View
                style={{
                  marginTop: 2,
                  height: 24,
                  paddingHorizontal: 10,
                  borderRadius: 99,
                  backgroundColor: badgeBg,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...body(11.5, 700), color: badgeFg }}>{badgeText}</Text>
              </View>
            ) : null}
          </View>

          <VariantPicker
            look={look}
            names={def.variants.map((_, i) => copy.variant(look, i))}
            selected={settings.v}
            onPick={(v) => store.setConfig(look, { v })}
          />

          <View style={{ gap: 4 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <Text
                style={{
                  ...body(12, 600, 0.05),
                  textTransform: 'uppercase',
                  color: palette.inkSoft,
                }}
              >
                {copy.intensity(look)}
              </Text>
              <Text
                style={{ ...body(13.5, 650), color: palette.ink, fontVariant: ['tabular-nums'] }}
              >
                {`${shownK}%`}
              </Text>
            </View>
            <IntensitySlider
              value={settings.k}
              accent={palette.accent}
              trackColor={palette.chipBg}
              accessibilityLabel={copy.intensity(look)}
              onChange={(k) => {
                setShownK(k);
                store.setConfig(look, { k }, { persist: false });
              }}
              onCommit={(k) => {
                haptics.tick();
                store.setConfig(look, { k });
              }}
            />
          </View>

          <EffectChips
            look={look}
            controls={def.ctl}
            values={settings}
            copy={copy}
            onToggle={(key, on) => store.setConfig(look, { [key]: on })}
          />
        </Animated.ScrollView>
      </GestureDetector>

      {/* Pinned under the scroll so the button stays on screen whatever the phone's height. */}
      <View style={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: bottom(30), gap: 4 }}>
        <PressScale
          accessibilityRole="button"
          scaleTo={0.97}
          disabled={ctaDisabled}
          onPress={() => void (owned ? wear() : purchase())}
          style={{
            height: 52,
            borderRadius: 99,
            backgroundColor: palette.btnBg,
            opacity: ctaDisabled && !busy ? 0.5 : 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
          }}
        >
          {busy ? <ActivityIndicator color={palette.btnFg} /> : null}
          <Text style={{ ...body(16.5, 650), color: palette.btnFg }}>
            {busy ? t('look.buying') : ctaLabel}
          </Text>
        </PressScale>
        {!owned && !customer.max.active ? (
          <PressScale
            accessibilityRole="button"
            scaleTo={0.97}
            onPress={() => {
              haptics.tick();
              router.push({ pathname: '/max', params: { from: 'looks' } });
            }}
            style={{ height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              style={{ ...body(13.5, 600), color: palette.ink, textDecorationLine: 'underline' }}
            >
              {t('look.viaMax')}
            </Text>
          </PressScale>
        ) : null}
        {note ? (
          <Text
            style={{
              ...body(11.5),
              lineHeight: 16.1,
              textAlign: 'center',
              color: palette.inkSoft,
              paddingHorizontal: 8,
            }}
          >
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
