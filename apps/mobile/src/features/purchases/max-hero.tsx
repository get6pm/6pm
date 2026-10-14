import { useEffect, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { LookConfig, LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import type { CompanionForm } from '../../ui/companion/companion-mood';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display } from '../../ui/type/fonts';
import { LookPreview, MAX_PREVIEW } from '../looks/look-preview';
import { MaxGlow } from './max-glow';
import { SCENE_LOOKS } from './products';
import { MAX_CREAM, MAX_FONT, MAX_INK, MAX_PAGE } from './max-colours';

const CARD = { width: 112, height: 168 };

/** The three living scenes fan out above the wordmark: x, y, tilt, stacking, and float period. */
const FAN = [
  { look: SCENE_LOOKS[0], x: -98, y: 16, rotate: -10, z: 1, seconds: 5.2 },
  { look: SCENE_LOOKS[1], x: 0, y: 0, rotate: 0, z: 2, seconds: 4.6 },
  { look: SCENE_LOOKS[2], x: 98, y: 16, rotate: 10, z: 1, seconds: 5.8 },
] as const;

/** Rises 8 pt and settles, over `seconds`, for ever: the card floats. Still with Reduce Motion. */
function Floating({
  seconds,
  children,
}: {
  readonly seconds: number;
  readonly children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const lift = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    const ease = Easing.bezier(0.42, 0, 0.58, 1);
    const half = (seconds * 1000) / 2;
    lift.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: half, easing: ease }),
        withTiming(0, { duration: half, easing: ease }),
      ),
      -1,
    );
  }, [lift, reduce, seconds]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

/**
 * The top of the Max sheet (prototype `App:983-1009`): the paid skies blurred into a glow, three
 * living scenes floating over it, the companion, and the wordmark. `children` draw over it
 * (the grabber and close button belong to the sheet).
 */
export function MaxHero({
  hour,
  configs,
  safe,
  onClose,
  companion,
}: {
  /** The Max companion the sheet was opened for; otherwise the one worn. */
  readonly companion?: CompanionForm | undefined;
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly safe: string;
  readonly onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <View style={{ height: 304, overflow: 'hidden' }}>
      <MaxGlow hour={hour} configs={configs} blur={38} saturation={1.3} opacity={0.75} inset={50} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(90% 75% at 50% 35%, rgba(15,12,20,0) 0%, rgba(15,12,20,.55) 60%, ${MAX_PAGE} 100%)`,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 8,
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: 'rgba(255,255,255,.4)',
        }}
      />
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('max.close')}
        scaleTo={0.92}
        onPress={onClose}
        hitSlop={8}
        style={{
          position: 'absolute',
          zIndex: 3,
          top: 16,
          right: 16,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: 'rgba(10,8,16,.45)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="close" size={19} color="#ffffff" />
      </PressScale>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: '50%', top: 40, width: 0, height: 0 }}
      >
        {FAN.map(({ look, x, y, rotate, z, seconds }) => (
          <View
            key={look}
            style={{
              position: 'absolute',
              left: x - CARD.width / 2,
              top: y,
              width: CARD.width,
              height: CARD.height,
              zIndex: z,
              transform: [{ rotate: `${rotate}deg` }],
            }}
          >
            <Floating seconds={seconds}>
              <View
                style={{
                  flex: 1,
                  borderRadius: 22,
                  overflow: 'hidden',
                  boxShadow: '0 22px 44px rgba(0,0,0,.55)',
                }}
              >
                <LookPreview
                  look={look}
                  hour={hour}
                  config={configs[look]}
                  safe={safe}
                  label={t('looks.safeToday')}
                  metrics={MAX_PREVIEW}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: 22,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)',
                  }}
                />
              </View>
            </Floating>
          </View>
        ))}
      </View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: '50%', bottom: 46, marginLeft: -44, zIndex: 3 }}
      >
        <Companion size={88} mood="happy" {...(companion ? { form: companion } : {})} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 14,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <Text style={{ ...display(32, 700, -0.03, MAX_FONT), lineHeight: 32, color: MAX_CREAM }}>
          6pm
        </Text>
        <View
          style={{
            height: 24,
            paddingHorizontal: 9,
            borderRadius: 8,
            backgroundColor: MAX_CREAM,
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(13, 800, 0.12), color: MAX_INK }}>MAX</Text>
        </View>
      </View>
    </View>
  );
}
