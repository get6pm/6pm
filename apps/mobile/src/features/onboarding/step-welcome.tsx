import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { RestoreFromBackupLink } from '../backup/restore-link';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display, leading } from '../../ui/type/fonts';
import { ease, popEntering, riseEntering, useLoop } from './onboarding-motion';
import { HORIZON, tileOf, type OnboardingPalette } from './onboarding-palette';

const PROMISES = [
  ['bolt', 'onboarding.welcome.catch', 60],
  ['swipe', 'onboarding.welcome.swipe', 25],
  ['wb_twilight', 'onboarding.welcome.wake', 300],
] as const satisfies readonly (readonly [SymbolName, string, number])[];

/** `shimmer`: .25 → .6 → .25 over 2.4 s, each line a little later than the one above. */
function HorizonLine({ index }: { readonly index: number }) {
  const line = HORIZON[index] ?? HORIZON[0];
  const phase = useLoop(2400, index * 600, 0.5);
  const style = useAnimatedStyle(() => {
    const p = phase.value;
    const k = p < 0.5 ? p / 0.5 : (1 - p) / 0.5;
    return { opacity: 0.25 + 0.35 * k };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: line.inset,
          right: line.inset,
          top: '62%',
          marginTop: line.top,
          height: 3,
          borderRadius: 3,
          backgroundColor: line.color,
        },
        style,
      ]}
    />
  );
}

/** Welcome: the companion waving over the horizon, the promise in three lines, Get started. */
export function StepWelcome({
  pal,
  onStart,
}: {
  readonly pal: OnboardingPalette;
  readonly onStart: () => void;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={riseEntering(600, 0, reduceMotion)} style={{ flex: 1, gap: 18 }}>
      <View style={{ flex: 1, minHeight: 230, alignItems: 'center', justifyContent: 'center' }}>
        {HORIZON.map((_, i) => (
          <HorizonLine key={i} index={i} />
        ))}
        <Animated.View entering={popEntering(800, 200, reduceMotion, ease.popIn)}>
          <Companion size={170} mood="wave" />
        </Animated.View>
      </View>
      <BalancedText
        accessibilityRole="header"
        style={{ ...leading(display(52, 600, -0.035), 49.4), color: pal.ink }}
      >
        {t('onboarding.welcome.title')}
      </BalancedText>
      <View style={{ gap: 10 }}>
        {PROMISES.map(([icon, key, hue], k) => {
          const tile = tileOf(hue);
          return (
            <Animated.View
              key={key}
              entering={riseEntering(500, 300 + k * 120, reduceMotion)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  experimental_backgroundImage: tile.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Symbol name={icon} size={20} fill={1} color={tile.glyph} />
              </View>
              <Text style={{ ...body(16, 550), color: pal.ink }}>{t(key)}</Text>
            </Animated.View>
          );
        })}
      </View>
      <PressScale
        scaleTo={0.97}
        onPress={onStart}
        accessibilityRole="button"
        style={{
          height: 58,
          marginTop: 4,
          borderRadius: 99,
          backgroundColor: pal.btnBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(17, 700), color: pal.btnFg }}>{t('onboarding.welcome.start')}</Text>
      </PressScale>
      <RestoreFromBackupLink color={pal.ink} />
    </Animated.View>
  );
}
