import type { SkImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedRef,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { paletteFor, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { SHOP_ORDER, SHOP_TIERS, type CardBadge, type ShopTier } from './look-catalogue';
import type { LookCopy } from './look-copy';
import { ShopCard, type CardHandle, type CardRect } from './shop-card';

/** The prototype's card is 346 × 520 on a 402 pt screen: 28 pt in from each side. */
const SIDE = 28;
const GAP = 12;
const RATIO = 520 / 346;
/** The cards' shadows reach this far above and below them. */
const SHADOW_TOP = 30;
const SHADOW_BOTTOM = 56;

/** The pager's measures on this screen. */
export function usePagerMetrics() {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    const card = width - SIDE * 2;
    return { side: SIDE, card, height: Math.round(card * RATIO), step: card + GAP };
  }, [width]);
}

/** Everything a card shows that depends on who is looking: its badge and its button. */
export interface CardFace {
  readonly badge: CardBadge;
  readonly badgeText: string | null;
  readonly cta: string;
}

/**
 * The shop's looks one at a time, side to side (prototype `App:886-910`), snapping a card at a
 * time. Only the cards beside the one in front are mounted, so a sky is drawn for at most three.
 * The page in front is reported as it changes and its offset is shared, for the dots and shelves.
 */
export function ShopPager({
  listRef,
  focus,
  hour,
  configs,
  faces,
  copy,
  live,
  onFocus,
  onOpen,
  hidden,
  register,
}: {
  readonly listRef: AnimatedRef<Animated.FlatList<LookId>>;
  readonly focus: number;
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly faces: Readonly<Record<LookId, CardFace>>;
  readonly copy: LookCopy;
  /** Whether the shop is showing: off, every sky holds still. */
  readonly live: boolean;
  readonly onFocus: (index: number) => void;
  readonly onOpen: (
    look: LookId,
    rect: CardRect | null,
    cta: string,
    image: SkImage | null,
  ) => void;
  /** The look whose card is flying, kept out of the pager meanwhile. */
  readonly hidden: LookId | null;
  readonly register: (look: LookId, card: CardHandle | null) => void;
}) {
  const m = usePagerMetrics();
  const last = useSharedValue(focus);
  useEffect(() => last.set(focus), [focus, last]);

  // The page in front is reported once the pager comes to rest, never mid-swipe: the dots follow
  // the offset on the UI thread, and nothing on the JS thread competes with the swipe.
  const settle = (x: number) => {
    'worklet';
    const at = Math.min(SHOP_ORDER.length - 1, Math.max(0, Math.round(x / m.step)));
    if (at !== last.get()) {
      last.set(at);
      scheduleOnRN(onFocus, at);
    }
  };
  const onScroll = useAnimatedScrollHandler({
    onEndDrag: (e) => {
      // A drag let go exactly on a card has no momentum to end.
      if (Math.abs(e.velocity?.x ?? 0) < 0.05) settle(e.contentOffset.x);
    },
    onMomentumEnd: (e) => settle(e.contentOffset.x),
  });

  const getItemLayout = useCallback(
    (_: ArrayLike<LookId> | null | undefined, index: number) => ({
      length: m.step,
      offset: m.step * index,
      index,
    }),
    [m.step],
  );

  return (
    <Animated.FlatList
      ref={listRef}
      data={SHOP_ORDER}
      keyExtractor={(id) => id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={m.step}
      decelerationRate="fast"
      disableIntervalMomentum
      initialScrollIndex={focus}
      getItemLayout={getItemLayout}
      // Every card stays mounted once drawn, so a swipe never builds a sky mid-scroll: the first
      // three come with the sheet, the rest a couple at a time while it settles.
      initialNumToRender={3}
      maxToRenderPerBatch={2}
      updateCellsBatchingPeriod={120}
      windowSize={SHOP_ORDER.length * 2 + 1}
      extraData={{ focus, hour, configs, faces, live, hidden }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      // Room for the cards' shadows, taken back out of the layout so the cards sit where they did.
      contentContainerStyle={{
        paddingHorizontal: m.side,
        paddingTop: SHADOW_TOP,
        paddingBottom: SHADOW_BOTTOM,
      }}
      style={{ marginTop: 4 - SHADOW_TOP, marginBottom: 12 - SHADOW_BOTTOM, flexGrow: 0 }}
      renderItem={({ item, index }) => {
        const face = faces[item];
        return (
          <View style={{ marginRight: index === SHOP_ORDER.length - 1 ? 0 : GAP }}>
            <ShopCard
              look={item}
              width={m.card}
              height={m.height}
              hour={hour}
              config={configs[item]}
              focused={live && index === focus}
              badge={face.badge}
              badgeText={face.badgeText}
              cta={face.cta}
              copy={copy}
              onOpen={onOpen}
              hidden={hidden === item}
              register={register}
            />
          </View>
        );
      }}
    />
  );
}

/**
 * The card in front as its sky alone, where the pager will be: what the sheet carries while it
 * slides up, before the live cards are built.
 */
export function PagerPlaceholder({
  look,
  hour,
  config,
}: {
  readonly look: LookId;
  readonly hour: number;
  readonly config: Partial<LookConfig> | undefined;
}) {
  const m = usePagerMetrics();
  const sky = useMemo(
    () => paletteFor({ look, hour, serious: false, config: config ?? {} }).sky,
    [look, hour, config],
  );
  return (
    <View style={{ paddingHorizontal: m.side, paddingTop: 4, paddingBottom: 12 }}>
      <View style={{ width: m.card, height: m.height, borderRadius: 32, backgroundImage: sky }} />
    </View>
  );
}

/** One shelf's button, its fill fading in as the pager reaches it. */
function TierButton({
  label,
  sub,
  on,
  onPress,
}: {
  readonly label: string;
  readonly sub: string;
  readonly on: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const lit = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    lit.set(withTiming(on ? 1 : 0, { duration: 200, reduceMotion: ReduceMotion.System }));
  }, [on, lit]);
  const fill = useAnimatedStyle(() => ({ opacity: lit.get() }));
  const fg = on ? palette.btnFg : palette.ink;
  return (
    <PressScale
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      scaleTo={0.96}
      onPress={onPress}
      style={{
        flex: 1,
        height: 54,
        paddingHorizontal: 10,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: palette.chipBg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Animated.View
        style={[
          { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
          { backgroundColor: palette.btnBg },
          fill,
        ]}
      />
      <Text numberOfLines={1} style={{ ...body(13.5, 650), color: fg }}>
        {label}
      </Text>
      <Text numberOfLines={1} style={{ ...body(11, 500), color: fg, opacity: 0.75 }}>
        {sub}
      </Text>
    </PressScale>
  );
}

/** Free, Classic, Living scenes: the shelf in front is filled; a tap goes to its first look. */
export function ShopTiers({
  tier,
  subs,
  onTier,
}: {
  readonly tier: ShopTier;
  readonly subs: Readonly<Record<ShopTier, string>>;
  readonly onTier: (tier: ShopTier) => void;
}) {
  const { t } = useI18n();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 22 }}
    >
      {SHOP_TIERS.map((k) => (
        <TierButton
          key={k}
          label={t(`looks.tier.${k}`)}
          sub={subs[k]}
          on={tier === k}
          onPress={() => {
            haptics.tick();
            onTier(k);
          }}
        />
      ))}
    </View>
  );
}
