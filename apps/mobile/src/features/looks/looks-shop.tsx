import type { SkImage } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import type { AnimatedRef } from 'react-native-reanimated';

import type { LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import type { ScrollDismiss } from '../../ui/motion/use-sheet-drag';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useToast } from '../../ui/toast/toast-host';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useCompanionToast } from '../companion/use-companion-toast';
import { resolveLook } from '../purchases/entitlement';
import { CLASSIC_LOOKS, isPaidLook, LEGAL_LINKS, SCENE_LOOKS } from '../purchases/products';
import { usePurchases } from '../purchases/purchases-provider';
import { cardBadge, firstOfTier, SHOP_ORDER, tierOf, type ShopTier } from './look-catalogue';
import { lookCopy } from './look-copy';
import { DaySlider } from './day-slider';
import { useLookSettings } from './look-settings-provider';
import { BackSheetHeader } from './sheet-header';
import type { CardHandle, CardRect } from './shop-card';
import { ShopMaxCard } from './shop-max-card';
import { PagerPlaceholder, ShopPager, ShopTiers, type CardFace } from './shop-pager';

/**
 * The Looks shop (prototype `App:868-966`): the three shelves, every look as a card wearing its
 * real sky, a dot for each, the time of day to see them all at another hour, the Max card,
 * Restore and the small print. `grab` wraps the header, which drags the sheet.
 */
export function LooksShop({
  listRef,
  focus,
  shopHour,
  live,
  onFocus,
  onJump,
  onShopHour,
  onOpen,
  onDone,
  grab,
  scroll,
  hidden,
  register,
  settled,
}: {
  readonly listRef: AnimatedRef<Animated.FlatList<LookId>>;
  readonly focus: number;
  readonly shopHour: number | null;
  readonly live: boolean;
  readonly onFocus: (index: number) => void;
  readonly onJump: (index: number) => void;
  readonly onShopHour: (hour: number | null) => void;
  readonly onOpen: (
    look: LookId,
    rect: CardRect | null,
    cta: string,
    image: SkImage | null,
  ) => void;
  readonly onDone: () => void;
  readonly grab: (header: ReactNode) => ReactNode;
  /** The scroll pulls the sheet down from its top. */
  readonly scroll: ScrollDismiss;
  readonly hidden: LookId | null;
  readonly register: (look: LookId, card: CardHandle | null) => void;
  /** The sheet is up: the live cards can be built. Until then the card in front is its sky. */
  readonly settled: boolean;
}) {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const { hour } = useClock();
  const { bottom } = useDesignInsets();
  const toast = useToast();
  const say = useCompanionToast();
  const { customer, offerings, loadOfferings, busy, restore } = usePurchases();
  const { look, config } = useLookSettings();
  const copy = useMemo(() => lookCopy(t), [t]);
  const worn = resolveLook(look, customer);
  const shown = shopHour ?? hour;
  const focused = SHOP_ORDER[focus] ?? worn;

  // The placeholder sky stays a moment after the pager arrives, while its first skies draw.
  const [placeholder, setPlaceholder] = useState(true);
  useEffect(() => {
    if (!settled) return;
    const id = setTimeout(() => setPlaceholder(false), 300);
    return () => clearTimeout(id);
  }, [settled]);

  // The offerings load at launch; opening the shop asks again if the store did not answer then.
  useEffect(() => loadOfferings(), [loadOfferings]);

  const faces = useMemo(() => {
    const out = {} as Record<LookId, CardFace>;
    for (const id of SHOP_ORDER) {
      const badge = cardBadge(id, worn, customer);
      const offer = isPaidLook(id) ? offerings?.looks[id] : undefined;
      const badgeText = badge === 'price' ? (offer?.priceText ?? null) : t(`looks.badge.${badge}`);
      const cta =
        badge === 'inUse'
          ? t('looks.card.customise')
          : badge === 'price' && offer
            ? t('looks.card.tryOnPrice', { price: offer.priceText })
            : t('looks.card.tryOn');
      out[id] = { badge, badgeText, cta };
    }
    return out;
  }, [worn, customer, offerings, t]);

  const shelfSub = (looks: readonly LookId[]) => {
    if (customer.max.active) return t('looks.tierSub.max');
    const first = looks[0];
    const offer = first && isPaidLook(first) ? offerings?.looks[first] : undefined;
    return offer ? t('looks.tierSub.each', { price: offer.priceText }) : t('looks.tierSub.once');
  };
  const subs: Record<ShopTier, string> = {
    free: t('looks.tierSub.free'),
    classic: shelfSub(CLASSIC_LOOKS),
    scene: shelfSub(SCENE_LOOKS),
  };

  const openMax = useCallback(() => {
    haptics.tick();
    router.push({ pathname: '/max', params: { from: 'looks' } });
  }, [router]);

  const doRestore = async () => {
    haptics.tap();
    const outcome = await restore();
    if (outcome.kind === 'found') {
      haptics.success();
      say('restored');
    } else toast(outcome.kind === 'none' ? t('looks.restore.none') : t('looks.restore.failed'));
  };
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => toast(t('looks.restore.failed')));
  };

  return (
    <View style={{ flex: 1 }}>
      {grab(
        <BackSheetHeader
          title={t('looks.title')}
          backLabel={t('looks.back')}
          onBack={() => {
            haptics.tap();
            router.replace('/settings');
          }}
          onDone={() => {
            haptics.tap();
            onDone();
          }}
        />,
      )}
      <GestureDetector gesture={scroll.gesture}>
        <Animated.ScrollView
          ref={scroll.ref}
          onScroll={scroll.onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 2, paddingBottom: bottom(44), gap: 18 }}
          showsVerticalScrollIndicator={false}
        >
          <ShopTiers tier={tierOf(focused)} subs={subs} onTier={(k) => onJump(firstOfTier(k))} />
          <View style={{ gap: 14 }}>
            <View>
              {/* The sky alone stays under the pager until its first cards have drawn. */}
              {placeholder ? (
                <View style={{ position: 'absolute', left: 0, top: 0 }}>
                  <PagerPlaceholder look={focused} hour={shown} config={config[focused]} />
                </View>
              ) : null}
              {settled ? (
                <ShopPager
                  listRef={listRef}
                  focus={focus}
                  hour={shown}
                  configs={config}
                  faces={faces}
                  copy={copy}
                  live={live}
                  onFocus={onFocus}
                  onOpen={onOpen}
                  hidden={hidden}
                  register={register}
                />
              ) : (
                <PagerPlaceholder look={focused} hour={shown} config={config[focused]} />
              )}
            </View>
          </View>
          <DaySlider
            look={focused}
            config={config[focused]}
            now={hour}
            hour={shopHour}
            onHour={onShopHour}
          />
          <View style={{ paddingTop: 6, paddingHorizontal: 22, gap: 18 }}>
            <ShopMaxCard
              customer={customer}
              offerings={offerings}
              hour={hour}
              configs={config}
              onPress={openMax}
            />
            <View style={{ alignItems: 'center', gap: 8 }}>
              <PressScale
                accessibilityRole="button"
                disabled={busy}
                scaleTo={0.95}
                onPress={() => void doRestore()}
                style={{ height: 40, paddingHorizontal: 14, justifyContent: 'center' }}
              >
                <Text style={{ ...body(14, 600), color: palette.ink }}>{t('looks.restore')}</Text>
              </PressScale>
              <Text
                style={{
                  ...body(12),
                  lineHeight: 17.4,
                  textAlign: 'center',
                  color: palette.inkSoft,
                  paddingHorizontal: 8,
                }}
              >
                {t('looks.legal')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {[
                  { label: t('max.terms'), url: LEGAL_LINKS.terms },
                  { label: t('max.privacy'), url: LEGAL_LINKS.privacy },
                ].map(({ label, url }) => (
                  <PressScale
                    key={url}
                    accessibilityRole="link"
                    hitSlop={8}
                    onPress={() => openLink(url)}
                  >
                    <Text
                      style={{
                        ...body(12, 600),
                        color: palette.inkSoft,
                        textDecorationLine: 'underline',
                      }}
                    >
                      {label}
                    </Text>
                  </PressScale>
                ))}
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
}
