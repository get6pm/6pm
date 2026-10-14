import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { isLookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { Symbol } from '../../ui/icons/symbol';
import { haptics } from '../../ui/haptics';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { body, display } from '../../ui/type/fonts';
import { useBackupStatus } from '../backup/use-backup-status';
import { lookCopy } from '../looks/look-copy';
import { useLookSettings } from '../looks/look-settings-provider';
import { confettiPieces, type ConfettiPiece } from './confetti';
import { parseMaxFrom, welcomeAction } from './max-context';
import { MaxGlow } from './max-glow';
import { PAID_LOOKS, SCENE_LOOKS } from './products';
import { MAX_CREAM, MAX_FONT, MAX_INK, MAX_PAGE } from './max-colours';

const CSS_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const STAMP_EASE = Easing.bezier(0.2, 1.4, 0.4, 1);
const FALL_EASE = Easing.bezier(0.3, 0.6, 0.5, 1);

/** The design's `rise`: fades in while lifting 14 pt, after `delay` seconds, and stays there. */
function Rise({
  delay,
  seconds,
  children,
}: {
  readonly delay: number;
  readonly seconds: number;
  readonly children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      reduce ? 0 : delay * 1000,
      withTiming(1, { duration: reduce ? 200 : seconds * 1000, easing: CSS_EASE }),
    );
  }, [p, delay, seconds, reduce]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: 14 * (1 - p.value) }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** The MAX stamp lands: 2.4× and tilted −14°, then −7° at .94, then home at full size and .92 opacity. */
function MaxStamp() {
  const reduce = useReducedMotion();
  const first = useSharedValue(0);
  const second = useSharedValue(0);
  useEffect(() => {
    first.value = withDelay(
      reduce ? 0 : 250,
      withTiming(1, { duration: reduce ? 200 : 420, easing: STAMP_EASE }, (done) => {
        if (done) second.value = withTiming(1, { duration: reduce ? 1 : 280, easing: STAMP_EASE });
      }),
    );
  }, [first, second, reduce]);
  const style = useAnimatedStyle(() => ({
    opacity: first.value < 1 ? first.value : 1 - 0.08 * second.value,
    transform: [
      { rotate: `${-14 + 7 * first.value}deg` },
      { scale: first.value < 1 ? 2.4 - 1.46 * first.value : 0.94 + 0.06 * second.value },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          height: 40,
          paddingHorizontal: 15,
          borderRadius: 12,
          backgroundColor: MAX_CREAM,
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ ...body(20, 800, 0.16), color: MAX_INK }}>MAX</Text>
    </Animated.View>
  );
}

/** One piece falling the screen's height, turning 560° and fading out over its last 15%. */
function Confetto({ piece, fall }: { readonly piece: ConfettiPiece; readonly fall: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      piece.delaySeconds * 1000,
      withTiming(1, { duration: piece.seconds * 1000, easing: FALL_EASE }),
    );
  }, [p, piece]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value < 0.85 ? 1 : Math.max(0, 1 - (p.value - 0.85) / 0.15),
    transform: [{ translateY: fall * p.value }, { rotate: `${560 * p.value}deg` }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${piece.left}%`,
          top: -24,
          width: piece.width,
          height: piece.height,
          borderRadius: 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/**
 * Max, bought (prototype `App:1071-1100`): the skies glow behind the companion as it grows into
 * its Max form, the stamp lands, confetti falls, and each thing now unlocked rises into place.
 */
export function MaxWelcome() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; look?: string }>();
  const from = parseMaxFrom(params.from);
  const tried = isLookId(params.look) ? params.look : null;
  const { t } = useI18n();
  const copy = useMemo(() => lookCopy(t), [t]);
  const { hour } = useClock();
  const { top } = useDesignInsets();
  const { height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const { config } = useLookSettings();
  const [evolved, setEvolved] = useState(false);
  const pieces = useMemo(() => confettiPieces(), []);
  // Backup is only "on" once the user has turned it on; buying Max does not do it for them.
  const backup = useBackupStatus();

  // The companion starts as it was and grows into its Max form once the screen has settled.
  useEffect(() => {
    const timer = setTimeout(() => setEvolved(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const action = welcomeAction(from, tried !== null);
  const wins = [
    t('max.welcome.win.looks', {
      looks: PAID_LOOKS.length,
      scenes: SCENE_LOOKS.length,
    }),
    t('max.welcome.win.ask'),
    backup.status?.kind === 'on' ? t('max.welcome.win.backup') : t('max.welcome.win.backupReady'),
    t('max.welcome.win.icons'),
    t('max.welcome.win.buddy'),
    t('max.welcome.win.more'),
  ];
  const done = () => {
    haptics.tap();
    router.dismissTo('/');
  };
  const go = () => {
    if (!action.href) return done();
    haptics.tap();
    const { href } = action;
    router.dismissTo('/');
    router.push(href);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{ flex: 1, backgroundColor: MAX_PAGE, overflow: 'hidden' }}
    >
      <MaxGlow hour={hour} configs={config} blur={60} saturation={1.4} opacity={0.6} inset={80} />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage: `radial-gradient(80% 60% at 50% 34%, rgba(15,12,20,.1), ${MAX_PAGE} 80%)`,
          },
        ]}
      />
      {reduce
        ? null
        : pieces.map((piece, i) => <Confetto key={i} piece={piece} fall={height + 70} />)}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          paddingTop: top(70),
          paddingHorizontal: 28,
        }}
      >
        <Companion size={100} mood="happy" form={evolved ? 'max' : 'base'} />
        <MaxStamp />
        <Rise delay={0.45} seconds={0.5}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text
              accessibilityRole="header"
              style={{
                ...display(36, 500, -0.02, MAX_FONT),
                lineHeight: 37.4,
                textAlign: 'center',
                color: MAX_CREAM,
              }}
            >
              {t('max.welcome.title')}
            </Text>
            <Text
              style={{
                ...body(15),
                lineHeight: 21.75,
                textAlign: 'center',
                color: 'rgba(246,239,230,.7)',
              }}
            >
              {tried ? t('max.welcome.subLook', { name: copy.name(tried) }) : t('max.welcome.sub')}
            </Text>
          </View>
        </Rise>
        <View style={{ width: '100%', maxWidth: 300, marginTop: 8, gap: 8 }}>
          {wins.map((win, i) => (
            <Rise key={i} delay={0.6 + i * 0.12} seconds={0.4}>
              <View
                style={{
                  height: 40,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,.06)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Symbol name="check_circle" size={20} fill={1} color="#59d98a" />
                <Text numberOfLines={2} style={{ ...body(14.5, 600), flex: 1, color: MAX_CREAM }}>
                  {win}
                </Text>
              </View>
            </Rise>
          ))}
        </View>
      </View>
      <Rise delay={1.2} seconds={0.4}>
        <View style={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 30, gap: 6 }}>
          <PressScale
            accessibilityRole="button"
            scaleTo={0.97}
            onPress={go}
            style={{
              height: 56,
              borderRadius: 18,
              backgroundColor: MAX_CREAM,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(17, 700), color: MAX_INK }}>
              {action.label ? t(`max.welcome.go.${action.label}`) : t('max.welcome.done')}
            </Text>
          </PressScale>
          {action.label ? (
            <PressScale
              accessibilityRole="button"
              scaleTo={0.97}
              onPress={done}
              style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ ...body(15, 600), color: 'rgba(246,239,230,.75)' }}>
                {t('max.welcome.done')}
              </Text>
            </PressScale>
          ) : null}
        </View>
      </Rise>
    </Animated.View>
  );
}
