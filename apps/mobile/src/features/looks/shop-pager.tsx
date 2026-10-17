import { useCallback, useEffect, useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { paletteFor, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { SHOP_ORDER, SHOP_TIERS, tierOf, type CardBadge, type ShopTier } from './look-catalogue';
import type { LookCopy } from './look-copy';
import { ShopCard, type CardRect } from './shop-card';

/** The prototype's card is 346 × 520 on a 402 pt screen: 28 pt in from each side. */
const SIDE = 28;
const GAP = 12;
const RATIO = 520 / 346;

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
  scrollX,
  focus,
  hour,
  configs,
  faces,
  copy,
  live,
  onFocus,
  onOpen,
}: {
  readonly listRef: AnimatedRef<Animated.FlatList<LookId>>;
  readonly scrollX: SharedValue<number>;
  readonly focus: number;
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly faces: Readonly<Record<LookId, CardFace>>;
  readonly copy: LookCopy;
  /** Whether the shop is showing: off, every sky holds still. */
  readonly live: boolean;
  readonly onFocus: (index: number) => void;
  readonly onOpen: (look: LookId, rect: CardRect | null) => void;
}) {
  const m = usePagerMetrics();
  const last = useSharedValue(focus);
  useEffect(() => last.set(focus), [focus, last]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.set(e.contentOffset.x);
      const at = Math.min(
        SHOP_ORDER.length - 1,
        Math.max(0, Math.round(e.contentOffset.x / m.step)),
      );
      if (at !== last.get()) {
        last.set(at);
        scheduleOnRN(onFocus, at);
      }
    },
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
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={3}
      extraData={{ focus, hour, configs, faces, live }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingHorizontal: m.side, paddingTop: 4, paddingBottom: 26 }}
      style={{ marginBottom: -14, flexGrow: 0 }}
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
            />
          </View>
        );
      }}
    />
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

/** A dot in the look's sky; its ring follows the pager's offset on the UI thread. */
function Dot({
  index,
  sky,
  gapBefore,
  label,
  scrollX,
  step,
  onPress,
}: {
  readonly index: number;
  readonly sky: string;
  readonly gapBefore: boolean;
  readonly label: string;
  readonly scrollX: SharedValue<number>;
  readonly step: number;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const near = (x: number) => {
    'worklet';
    return interpolate(Math.abs(x / step - index), [0, 1], [1, 0], Extrapolation.CLAMP);
  };
  const ring = useAnimatedStyle(() => ({ opacity: near(scrollX.get()) }));
  const dot = useAnimatedStyle(() => ({ opacity: 0.7 + 0.3 * near(scrollX.get()) }));
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo={0.9}
      hitSlop={6}
      onPress={onPress}
      style={{ width: 14, height: 14, marginLeft: gapBefore ? 10 : 0 }}
    >
      <Animated.View
        style={[{ width: 14, height: 14, borderRadius: 7, backgroundImage: sky }, dot]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: -3.5,
            top: -3.5,
            width: 21,
            height: 21,
            borderRadius: 10.5,
            borderWidth: 1.5,
            borderColor: palette.ink,
          },
          ring,
        ]}
      />
    </PressScale>
  );
}

/** Every look as a dot in its own sky, a little apart shelf by shelf; a tap goes to it. */
export function ShopDots({
  hour,
  configs,
  scrollX,
  copy,
  onJump,
}: {
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly scrollX: SharedValue<number>;
  readonly copy: LookCopy;
  readonly onJump: (index: number) => void;
}) {
  const { t } = useI18n();
  const m = usePagerMetrics();
  // The dots' skies move on the hour, not with the slider, so scrubbing redraws only the cards.
  const whole = Math.floor(hour);
  const skies = useMemo(
    () =>
      SHOP_ORDER.map(
        (look) =>
          paletteFor({ look, hour: whole, serious: false, config: configs[look] ?? {} }).sky,
      ),
    [whole, configs],
  );
  return (
    <View
      style={{
        minHeight: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {SHOP_ORDER.map((look, i) => (
        <Dot
          key={look}
          index={i}
          sky={skies[i] ?? ''}
          gapBefore={i > 0 && tierOf(look) !== tierOf(SHOP_ORDER[i - 1] ?? look)}
          label={t('looks.card.position', {
            name: copy.name(look),
            index: i + 1,
            total: SHOP_ORDER.length,
          })}
          scrollX={scrollX}
          step={m.step}
          onPress={() => {
            haptics.tick();
            onJump(i);
          }}
        />
      ))}
    </View>
  );
}
