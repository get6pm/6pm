import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { configFor, lookById, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { useToast } from '../../ui/toast/toast-host';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import { useCompanionToast } from '../companion/use-companion-toast';
import { canUseLook, lookAccess, resolveLook } from '../purchases/entitlement';
import { isPaidLook } from '../purchases/products';
import { usePurchases } from '../purchases/purchases-provider';
import { neighbour, positionOf } from './look-catalogue';
import { lookCopy } from './look-copy';
import { DetailHeader, EffectsCard, TryOnPill } from './look-detail-parts';
import { useLookSettings, useLookSettingsStore } from './look-settings-provider';
import { IntensitySlider } from './intensity-slider';
import { VariantPicker } from './variant-picker';

const OPEN_MS = 450;
const open = Easing.bezier(0.2, 0.9, 0.2, 1);

/**
 * A look's sheet, with the look worn on the real app behind it (prototype `App:913-969`): choose a
 * palette, set the intensity and the two effects, then use it, or buy it. Nothing is saved as
 * worn until Use; the settings save as they change. The try-on ends when the sheet closes.
 */
export function LookDetail({ look }: { readonly look: LookId }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const say = useCompanionToast();
  const { top, bottom } = useDesignInsets();
  const { height } = useWindowDimensions();
  const { customer, offerings, offeringsStatus, loadOfferings, busy, buy } = usePurchases();
  const { look: chosen, config } = useLookSettings();
  const store = useLookSettingsStore();
  const copy = useMemo(() => lookCopy(t), [t]);
  const def = lookById(look);
  const settings = configFor(look, config[look]);
  const access = lookAccess(look, customer);
  const owned = access !== 'locked';
  const worn = resolveLook(chosen, customer);
  const offer = isPaidLook(look) ? offerings?.looks[look] : undefined;
  const [shownK, setShownK] = useState(settings.k);

  // The look is on the real app from the first frame, and comes off when this sheet goes.
  useEffect(() => store.setTryOn(look), [store, look]);
  useEffect(() => () => store.setTryOn(null), [store]);
  useEffect(() => loadOfferings(), [loadOfferings]);
  useEffect(() => setShownK(settings.k), [settings.k]);

  const slide = useSharedValue(height);
  useEffect(() => {
    slide.value = withTiming(0, { duration: OPEN_MS, easing: open });
  }, [slide]);
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: slide.value }] }));

  const go = (step: 1 | -1) => {
    haptics.tick();
    router.setParams({ id: neighbour(look, step) });
  };

  const wear = () => {
    if (!store.setLook(look, (id) => canUseLook(id, customer))) return;
    haptics.tap();
    say('lookSet');
    router.dismissTo('/');
  };

  const purchase = async () => {
    if (!offer) return;
    haptics.tap();
    const outcome = await buy(offer.productId);
    if (outcome.kind === 'purchased') {
      store.setLook(look, (id) => canUseLook(id, outcome.customer));
      haptics.success();
      say('lookNew');
      router.dismissTo('/');
    } else if (outcome.kind === 'failed') {
      toast(t('look.buyFailed'));
    }
  };

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
      : t('look.noteTry');

  return (
    <View style={{ flex: 1 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,.28))',
        }}
      />
      <TryOnPill name={copy.name(look)} />

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: top(384),
            bottom: 0,
            borderTopLeftRadius: 34,
            borderTopRightRadius: 34,
            backgroundColor: palette.sheetSolid,
            boxShadow: '0 -20px 60px rgba(10,5,20,.35)',
            overflow: 'hidden',
          },
          panel,
        ]}
      >
        <DetailHeader
          position={positionOf(look)}
          onBack={() => {
            haptics.tap();
            // The try-on replaced the shop, so "‹ Looks" brings the shop back in its place.
            router.replace('/looks');
          }}
          onStep={go}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 2,
            paddingHorizontal: 18,
            paddingBottom: 30,
            gap: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 5 }}>
            <Text
              accessibilityRole="header"
              style={{ ...display(34, 500, -0.01, def.font), lineHeight: 34.7, color: palette.ink }}
            >
              {copy.name(look)}
            </Text>
            <Text style={{ ...body(14), lineHeight: 19.6, color: palette.inkSoft }}>
              {copy.tag(look)}
            </Text>
          </View>

          <View style={{ gap: 9 }}>
            <Text
              style={{
                ...body(12.5, 600, 0.05),
                textTransform: 'uppercase',
                color: palette.inkSoft,
              }}
            >
              {t('look.palette')}
            </Text>
            <VariantPicker
              look={look}
              names={def.variants.map((_, i) => copy.variant(look, i))}
              selected={settings.v}
              onPick={(v) => store.setConfig(look, { v })}
            />
          </View>

          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <Text
                style={{
                  ...body(12.5, 600, 0.05),
                  textTransform: 'uppercase',
                  color: palette.inkSoft,
                }}
              >
                {copy.intensity(look)}
              </Text>
              <Text style={{ ...body(14, 650), color: palette.ink, fontVariant: ['tabular-nums'] }}>
                {`${shownK}%`}
              </Text>
            </View>
            <IntensitySlider
              value={settings.k}
              accent={palette.accent}
              trackColor={palette.hair}
              accessibilityLabel={copy.intensity(look)}
              onChange={(k) => {
                setShownK(k);
                store.setConfig(look, { k }, { persist: false });
              }}
              onCommit={(k) => store.setConfig(look, { k })}
            />
          </View>

          <EffectsCard
            look={look}
            controls={def.ctl}
            values={settings}
            copy={copy}
            onToggle={(key, on) => store.setConfig(look, { [key]: on })}
          />
        </ScrollView>
        {/* Pinned under the scroll so the button stays on screen whatever the phone's height. */}
        <View
          style={{
            gap: 6,
            paddingTop: 12,
            paddingHorizontal: 18,
            paddingBottom: bottom(40),
          }}
        >
          <PressScale
            accessibilityRole="button"
            scaleTo={0.97}
            disabled={ctaDisabled}
            onPress={() => void (owned ? wear() : purchase())}
            style={{
              height: 54,
              borderRadius: 18,
              backgroundColor: palette.btnBg,
              opacity: ctaDisabled && !busy ? 0.5 : 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
            }}
          >
            {busy ? <ActivityIndicator color={palette.btnFg} /> : null}
            <Text style={{ ...body(17, 650), color: palette.btnFg }}>
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
              style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                style={{
                  ...body(14.5, 600),
                  color: palette.ink,
                  textDecorationLine: 'underline',
                }}
              >
                {t('look.viaMax')}
              </Text>
            </PressScale>
          ) : null}
          <Text
            style={{
              ...body(12.5),
              lineHeight: 17.5,
              textAlign: 'center',
              color: palette.inkSoft,
              paddingHorizontal: 12,
            }}
          >
            {note}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
