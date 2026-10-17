import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import type { MaxPlan } from './products';
import type { Offerings } from './purchases-port';
import { MAX_CREAM, MAX_GOLD, MAX_INK } from './max-colours';

/** A bar that breathes while the store is asked (the prototype's `pulse`). */
function Shimmer({
  width,
  height,
  color,
  delay = 0,
}: {
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly delay?: number;
}) {
  const reduce = useReducedMotion();
  const o = useSharedValue(0.5);
  useEffect(() => {
    if (reduce) return;
    const half = { duration: 600, easing: Easing.inOut(Easing.ease) };
    o.set(
      withDelay(delay, withRepeat(withSequence(withTiming(1, half), withTiming(0.5, half)), -1)),
    );
  }, [o, delay, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: o.get() }));
  return (
    <Animated.View
      style={[
        { width, height, marginVertical: 3, borderRadius: height / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

/** One plan: its name and a radio, then the amount billed, how often, and the saving badge. */
function PlanCard({
  label,
  price,
  sub,
  saving,
  selected,
  loading,
  onPress,
}: {
  readonly label: string;
  readonly price: string | null;
  readonly sub: string | null;
  readonly saving: string | null;
  readonly selected: boolean;
  readonly loading: boolean;
  readonly onPress: () => void;
}) {
  const fg = selected ? MAX_INK : MAX_CREAM;
  const skel = selected ? 'rgba(22,19,28,.14)' : 'rgba(246,239,230,.14)';
  // The saving badge stands half above the card, so it sits beside it rather than in it: the card
  // clips what reaches past its edge.
  return (
    <View style={{ flex: 1 }}>
      <PressScale
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled: price === null }}
        accessibilityLabel={[label, price, sub].filter(Boolean).join(', ')}
        scaleTo={0.97}
        onPress={onPress}
        style={{
          flexGrow: 1,
          minHeight: 74,
          paddingTop: 12,
          paddingRight: 12,
          paddingBottom: 11,
          paddingLeft: 14,
          borderRadius: 18,
          backgroundColor: selected ? MAX_CREAM : 'rgba(255,255,255,.06)',
          boxShadow: selected
            ? `0 0 0 1.5px ${MAX_CREAM}`
            : 'inset 0 0 0 0.5px rgba(255,255,255,.12)',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <Text numberOfLines={1} style={{ ...body(12, 700, 0.02), color: fg }}>
            {label}
          </Text>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: fg,
              opacity: selected ? 1 : 0.5,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected ? (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: fg }} />
            ) : null}
          </View>
        </View>
        <View style={{ gap: 1 }}>
          {loading ? (
            <>
              <Shimmer width={96} height={16} color={skel} />
              <Shimmer width={72} height={9} color={skel} delay={150} />
            </>
          ) : (
            <>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  ...body(19, 700, -0.01),
                  lineHeight: 22,
                  minHeight: 22,
                  color: fg,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {price ?? ''}
              </Text>
              <Text
                numberOfLines={1}
                style={{ ...body(11.5), lineHeight: 15, color: fg, opacity: 0.7 }}
              >
                {sub ?? ''}
              </Text>
            </>
          )}
        </View>
      </PressScale>
      {saving ? (
        <View
          style={{
            position: 'absolute',
            top: -8,
            right: 12,
            height: 18,
            paddingHorizontal: 7,
            borderRadius: 99,
            backgroundColor: MAX_GOLD,
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(10, 800, 0.06), color: MAX_INK }}>{saving}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The Max sheet's pinned bottom, a frosted card floating over the page (prototype
 * `App:1110-1131`): the two plans with the amount each bills, the one button, the terms line, and
 * Manage once Max is on. While the store is asked the plans shimmer; when it does not answer they
 * say so and the button dims.
 */
export function MaxFooter({
  on,
  plan,
  offerings,
  loading,
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
  /** The store has not answered yet. */
  readonly loading: boolean;
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
  const waiting = busy || loading;
  return (
    <View
      style={{
        marginHorizontal: 10,
        marginBottom: Math.max(10, bottom(10)),
        borderRadius: 30,
        overflow: 'hidden',
        boxShadow:
          '0 -18px 50px rgba(0,0,0,.45), 0 24px 60px rgba(0,0,0,.5), inset 0 0 0 0.5px rgba(255,255,255,.1)',
      }}
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={{
          paddingTop: 14,
          paddingHorizontal: 12,
          paddingBottom: 16,
          gap: 12,
          backgroundColor: 'rgba(30,25,38,.72)',
        }}
      >
        {!on ? (
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
            {(['yearly', 'monthly'] as const).map((p) => {
              const offer = offerings?.max[p];
              const yearly = p === 'yearly';
              return (
                <PlanCard
                  key={p}
                  label={yearly ? t('max.plan.yearly') : t('max.plan.monthly')}
                  price={
                    offer
                      ? yearly
                        ? t('max.plan.perYear', { price: offer.priceText })
                        : t('max.perMonth', { price: offer.priceText })
                      : null
                  }
                  sub={
                    offer
                      ? yearly
                        ? t('max.plan.billedYear')
                        : t('max.plan.billedMonth')
                      : t('max.plan.unavailable')
                  }
                  saving={
                    yearly && offer && saving !== null
                      ? t('max.plan.save', { percent: saving })
                      : null
                  }
                  selected={p === plan}
                  loading={loading}
                  onPress={() => {
                    if (!offer) return;
                    haptics.tick();
                    onPlan(p);
                  }}
                />
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
            borderRadius: 99,
            backgroundImage: 'linear-gradient(180deg, #fff6e8, #f3e6d2)',
            boxShadow: '0 10px 30px rgba(255,210,122,.18), inset 0 1px 0 #ffffff',
            opacity: ctaOff && !waiting ? 0.5 : 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
          }}
        >
          {waiting && !on ? <ActivityIndicator color={MAX_INK} /> : null}
          <Text style={{ ...body(17, 700), color: MAX_INK }}>{cta}</Text>
        </PressScale>
        <Text
          style={{
            ...body(12),
            lineHeight: 16.2,
            minHeight: 16,
            textAlign: 'center',
            color: 'rgba(246,239,230,.55)',
          }}
        >
          {terms}
        </Text>
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
    </View>
  );
}
