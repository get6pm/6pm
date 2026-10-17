import { useEffect, type ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
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

import { oklchSrgbHex as ok } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { Companion } from '../../ui/companion/companion';
import { Symbol } from '../../ui/icons/symbol';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, mono } from '../../ui/type/fonts';
import type { MaxFrom } from './max-context';
import { Coin, ICON_SAMPLES, LockRing, SPINES, WIDGET_GLOW } from './max-tile-art';
import { MAX_CREAM, MAX_FONT, MAX_GOLD, MAX_INK } from './max-colours';

const DEEP = '0 18px 36px rgba(0,0,0,.45)';
const COIN =
  '0 14px 30px rgba(0,0,0,.45), inset 0 -4px 0 rgba(0,0,0,.18), inset 0 0 0 1px rgba(255,255,255,.35)';
const ease = Easing.bezier(0.42, 0, 0.58, 1);
const NONE: ViewProps['style'] = {};

/** Rises 8 pt and settles, over `seconds`, for ever. Still with Reduce Motion. */
export function Floating({
  seconds,
  style = NONE,
  children,
}: {
  readonly seconds: number;
  readonly style?: ViewProps['style'];
  readonly children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const lift = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    const half = (seconds * 1000) / 2;
    lift.set(
      withRepeat(
        withSequence(
          withTiming(-8, { duration: half, easing: ease }),
          withTiming(0, { duration: half, easing: ease }),
        ),
        -1,
      ),
    );
  }, [lift, reduce, seconds]);
  const moving = useAnimatedStyle(() => ({ transform: [{ translateY: lift.get() }] }));
  return (
    <View style={style}>
      <Animated.View style={[{ flexGrow: 1 }, moving]}>{children}</Animated.View>
    </View>
  );
}

/** Comes up 14 pt and fades in over .5 s after `delay` (the prototype's `rise`). */
function Rise({
  delay = 0,
  style = NONE,
  children,
}: {
  readonly delay?: number;
  readonly style?: ViewProps['style'];
  readonly children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const t = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce)
      t.set(withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })));
  }, [t, delay, reduce]);
  const shown = useAnimatedStyle(() => ({
    opacity: t.get(),
    transform: [{ translateY: (1 - t.get()) * 14 }],
  }));
  return (
    <View style={style}>
      <Animated.View style={shown}>{children}</Animated.View>
    </View>
  );
}

/** Places a child `left` and `top` from the hero's centre line. */
function At({
  left,
  top,
  rotate = 0,
  children,
}: {
  readonly left: number;
  readonly top: number;
  readonly rotate?: number;
  readonly children: ReactNode;
}) {
  return (
    <View style={{ position: 'absolute', left, top, transform: [{ rotate: `${rotate}deg` }] }}>
      {children}
    </View>
  );
}

/** A box whose children are placed from the hero's centre, `top` down. */
function Centre({ top, children }: { readonly top: number; readonly children: ReactNode }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: '50%', top, width: 0, height: 0 }}
    >
      {children}
    </View>
  );
}

function Bubble({ mine, text }: { readonly mine: boolean; readonly text: string }) {
  return (
    <View
      style={{
        maxWidth: mine ? 230 : 220,
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderRadius: 20,
        ...(mine ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }),
        backgroundColor: mine ? 'rgba(255,255,255,.14)' : MAX_CREAM,
        boxShadow: '0 12px 30px rgba(0,0,0,.35)',
      }}
    >
      <Text
        style={{
          ...leading(display(17, 500, 0, MAX_FONT), 21.25),
          color: mine ? MAX_CREAM : MAX_INK,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * The picture at the top of the Max sheet for each reason it was opened (prototype
 * `App:1063-1077`); the looks' fan is drawn by the hero itself.
 */
export function HeroArt({
  from,
  safe,
}: {
  readonly from: Exclude<MaxFrom, 'looks'>;
  readonly safe: string;
}) {
  const { t } = useI18n();
  const { palette } = useTheme();
  const { now } = useClock();
  switch (from) {
    case 'ask':
      return (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 44,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Rise style={{ alignSelf: 'flex-end', marginRight: 48 }}>
            <Bubble mine text={t('max.hero.askQ')} />
          </Rise>
          <Rise delay={200} style={{ alignSelf: 'flex-start', marginLeft: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Companion size={76} mood="think" form="max" />
              <Bubble mine={false} text={t('max.hero.askA')} />
            </View>
          </Rise>
          <View
            style={{
              marginTop: 2,
              height: 26,
              paddingHorizontal: 10,
              borderRadius: 99,
              backgroundColor: 'rgba(255,210,122,.16)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Text style={{ ...leading(display(20, 500, 0, MAX_FONT), 16), color: MAX_GOLD }}>
              ∞
            </Text>
            <Text style={{ ...body(12, 700), color: MAX_GOLD }}>{t('max.hero.askLimit')}</Text>
          </View>
        </View>
      );
    case 'pots':
      return (
        <Centre top={52}>
          {(
            [
              [-150, -8, 0.72, 150],
              [-37, 0, 0.42, 60],
              [76, 8, 0.9, 300],
            ] as const
          ).map(([left, rotate, fill, hue]) => (
            <At key={hue} left={left} top={0} rotate={rotate}>
              <View
                style={{
                  width: 74,
                  height: 104,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderBottomLeftRadius: 24,
                  borderBottomRightRadius: 24,
                  backgroundColor: 'rgba(255,255,255,.1)',
                  boxShadow: `inset 0 0 0 1px rgba(255,255,255,.16), ${DEEP}`,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `${fill * 100}%`,
                    backgroundImage: `linear-gradient(180deg, ${ok(0.84, 0.12, hue)}, ${ok(0.72, 0.14, hue)})`,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: 10,
                    right: 10,
                    top: 10,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,.25)',
                  }}
                />
              </View>
            </At>
          ))}
          <Floating seconds={4.8} style={{ position: 'absolute', left: -10, top: -14 }}>
            <View
              style={{
                height: 28,
                paddingHorizontal: 10,
                borderRadius: 99,
                backgroundColor: MAX_CREAM,
                boxShadow: '0 10px 24px rgba(0,0,0,.4)',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(12.5, 800), color: MAX_INK }}>+100k</Text>
            </View>
          </Floating>
        </Centre>
      );
    case 'travel':
      return (
        <Centre top={40}>
          {(
            [
              ['฿', 210, -140, 10, 70, 29],
              ['¥', 80, -58, -4, 84, 35],
              ['€', 300, 44, 14, 66, 28],
              ['$', null, 110, -2, 56, 24],
            ] as const
          ).map(([sign, hue, left, top, size, font]) => (
            <At key={sign} left={left} top={top}>
              <Coin sign={sign} hue={hue} size={size} font={font} ring={COIN} />
            </At>
          ))}
          <At left={-120} top={112}>
            <View
              style={{
                width: 240,
                height: 44,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,.1)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14), 0 12px 30px rgba(0,0,0,.4)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Symbol name="flight" size={18} color={MAX_CREAM} />
                <Text style={{ ...body(13, 700), color: MAX_CREAM }}>
                  {t('max.hero.travelPlace')}
                </Text>
              </View>
              <Text style={{ ...body(13, 700), color: MAX_CREAM, fontVariant: ['tabular-nums'] }}>
                {t('max.hero.travelLeft')}
              </Text>
            </View>
          </At>
        </Centre>
      );
    case 'diary':
      return (
        <Centre top={50}>
          <At left={-118} top={0}>
            <View style={{ height: 124, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
              {SPINES.map(([hue, light], i) => (
                <View
                  key={hue}
                  style={{
                    width: 26,
                    height: [92, 100, 88, 96][i],
                    borderRadius: 4,
                    backgroundColor: ok(light, hue === 150 ? 0.09 : 0.1, hue),
                    boxShadow: 'inset -3px 0 0 rgba(0,0,0,.22)',
                  }}
                />
              ))}
              <View
                style={{
                  width: 92,
                  height: 124,
                  marginLeft: 10,
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                  borderTopRightRadius: 14,
                  borderBottomRightRadius: 14,
                  backgroundColor: ok(0.82, 0.09, 50),
                  boxShadow: '0 20px 40px rgba(0,0,0,.5)',
                  overflow: 'hidden',
                  transformOrigin: '0% 100%',
                  transform: [{ rotate: '-4deg' }],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 10,
                    backgroundColor: 'rgba(0,0,0,.18)',
                  }}
                />
                <Text
                  style={{
                    ...leading(display(13, 700, 0, MAX_FONT), 14.3),
                    position: 'absolute',
                    left: 22,
                    top: 18,
                    right: 12,
                    color: '#2a1408',
                  }}
                >
                  {t('max.hero.diary')}
                </Text>
                <Text
                  style={{
                    ...mono(16, 600, 0.06),
                    position: 'absolute',
                    left: 22,
                    bottom: 12,
                    color: '#2a1408',
                  }}
                >
                  {now.getFullYear()}
                </Text>
              </View>
            </View>
          </At>
        </Centre>
      );
    case 'backup':
      return (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 48,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 104,
              height: 104,
              borderRadius: 32,
              backgroundImage: `linear-gradient(160deg, ${ok(0.56, 0.1, 190)}, ${ok(0.38, 0.08, 205)})`,
              boxShadow: '0 22px 44px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="cloud_done" size={60} fill={1} color="#ffffff" />
          </View>
          <View
            style={{
              height: 30,
              paddingLeft: 9,
              paddingRight: 12,
              borderRadius: 99,
              backgroundColor: 'rgba(255,255,255,.12)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Symbol name="lock" size={15} fill={1} color={MAX_GOLD} />
            <Text style={{ ...body(12.5, 700), color: MAX_CREAM }}>{t('max.hero.backup')}</Text>
          </View>
        </View>
      );
    case 'widgets':
      return (
        <Centre top={46}>
          <At left={-134} top={0}>
            <View
              style={{
                width: 128,
                height: 128,
                padding: 14,
                borderRadius: 28,
                backgroundImage: palette.sky,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16), 0 22px 44px rgba(0,0,0,.5)',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  ...body(11, 700, 0.06),
                  textTransform: 'uppercase',
                  color: palette.inkSoft,
                }}
              >
                {t('looks.safeToday')}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  ...leading(display(38, 600), 38, true),
                  color: palette.ink,
                  ...(palette.dark ? { ...WIDGET_GLOW, textShadowRadius: 6 } : null),
                }}
              >
                {safe}
              </Text>
            </View>
          </At>
          <At left={16} top={22}>
            <View style={{ borderRadius: 42, boxShadow: DEEP }}>
              <LockRing safe={safe} size={84} inset={9} font={18} well="#15121b" />
            </View>
          </At>
        </Centre>
      );
    case 'icons':
      return (
        <Centre top={38}>
          {(
            [
              [-150, 10, -8],
              [-82, 0, 4],
              [-14, 12, -3],
              [54, 2, 6],
              [122, 14, -6],
              [-118, 78, 5],
              [-50, 70, -4],
              [18, 80, 3],
              [86, 72, -7],
            ] as const
          ).map(([left, top, rotate], i) => {
            const [icon, hue] = ICON_SAMPLES[i] ?? ICON_SAMPLES[0] ?? ['spa', 120];
            return (
              <At key={icon} left={left} top={top} rotate={rotate}>
                <View style={{ borderRadius: 18, boxShadow: '0 14px 28px rgba(0,0,0,.4)' }}>
                  <CategoryTile icon={icon} hue={hue} size={58} radius={18} glyph={32} />
                </View>
              </At>
            );
          })}
        </Centre>
      );
    case 'buddy':
      return (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 52,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          <Companion size={124} mood="happy" form="max" />
          <Companion size={112} mood="wave" form="hac" />
        </View>
      );
  }
}
