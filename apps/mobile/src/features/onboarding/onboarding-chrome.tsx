import { Text, View } from 'react-native';
import Animated, {
  Keyframe,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { ease } from './onboarding-motion';
import { STEP_COUNT, type OnboardingPalette } from './onboarding-palette';

function Segment({ filled, pal }: { readonly filled: boolean; readonly pal: OnboardingPalette }) {
  const fill = useAnimatedStyle(() => ({
    width: withTiming(filled ? '100%' : '0%', { duration: 500, easing: ease.enter }),
    backgroundColor: pal.ink,
  }));
  return (
    <View
      style={{
        flex: 1,
        height: 4,
        borderRadius: 4,
        backgroundColor: pal.track,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[{ height: '100%', borderRadius: 4 }, fill]} />
    </View>
  );
}

/** Back, the eight-dash progress and Skip, in one 44 pt row. Hidden controls keep their place. */
export function OnboardingHeader({
  step,
  pal,
  showSkip,
  onBack,
  onSkip,
}: {
  readonly step: number;
  readonly pal: OnboardingPalette;
  readonly showSkip: boolean;
  readonly onBack: () => void;
  readonly onSkip: () => void;
}) {
  const { t } = useI18n();
  const canGoBack = step > 0;
  const back = useAnimatedStyle(() => ({
    opacity: withTiming(canGoBack ? 1 : 0, { duration: 300 }),
  }));
  const skip = useAnimatedStyle(() => ({
    opacity: withTiming(showSkip ? 1 : 0, { duration: 300 }),
  }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
      <Animated.View style={back} pointerEvents={canGoBack ? 'auto' : 'none'}>
        <PressScale
          scaleTo={0.92}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.back')}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pal.cell,
            boxShadow: pal.cardShadow,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="arrow_back" size={22} color={pal.ink} />
        </PressScale>
      </Animated.View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('onboarding.progress', { step: step + 1, total: STEP_COUNT })}
        style={{ flex: 1, flexDirection: 'row', gap: 4 }}
      >
        {Array.from({ length: STEP_COUNT }, (_, k) => (
          <Segment key={k} filled={k <= step} pal={pal} />
        ))}
      </View>
      <Animated.View style={skip} pointerEvents={showSkip ? 'auto' : 'none'}>
        <PressScale
          scaleTo={0.92}
          onPress={onSkip}
          accessibilityRole="button"
          style={{ minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ ...body(15, 600), color: pal.inkSoft }}>{t('onboarding.skip')}</Text>
        </PressScale>
      </Animated.View>
    </View>
  );
}

/** `bubbleIn`: scale .7 and 6 pt low to its place, from its tail at the bottom right. */
function bubbleEntering(reduceMotion: boolean) {
  return new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateY: reduceMotion ? 0 : 6 }, { scale: reduceMotion ? 1 : 0.7 }],
    },
    100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: ease.bubble },
  })
    .duration(reduceMotion ? 200 : 350)
    .reduceMotion(ReduceMotion.Never);
}

/** The companion at the top right with its line for the step; the bubble pops in on each step. */
export function CompanionLine({
  step,
  line,
  mood,
  pal,
  top,
}: {
  readonly step: number;
  readonly line: string;
  readonly mood: CompanionMood;
  readonly pal: OnboardingPalette;
  readonly top: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', right: 18, top, alignItems: 'flex-end', gap: 4, zIndex: 2 }}
    >
      <Animated.View
        key={step}
        entering={bubbleEntering(reduceMotion)}
        style={{
          paddingVertical: 7,
          paddingHorizontal: 12,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          borderBottomRightRadius: 4,
          borderBottomLeftRadius: 14,
          backgroundColor: pal.btnBg,
          maxWidth: 140,
          transformOrigin: 'right bottom',
        }}
      >
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...body(13, 600), lineHeight: 16.25, color: pal.btnFg }}
        >
          {line}
        </Text>
      </Animated.View>
      <Companion size={52} mood={mood} />
    </View>
  );
}

/** The wide button at the foot of each step. The last step's is the warm accent. */
export function OnboardingCta({
  label,
  icon,
  hot,
  pal,
  onPress,
}: {
  readonly label: string;
  readonly icon: SymbolName;
  readonly hot: boolean;
  readonly pal: OnboardingPalette;
  readonly onPress: () => void;
}) {
  const bg = hot ? pal.accent : pal.btnBg;
  const fg = hot ? pal.onAccent : pal.btnFg;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: withTiming(bg, { duration: 400 }),
  }));
  return (
    <PressScale
      scaleTo={0.97}
      onPress={onPress}
      accessibilityRole="button"
      style={{ marginTop: 16, flexShrink: 0 }}
    >
      <Animated.View
        style={[
          {
            height: 58,
            borderRadius: 99,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: hot ? pal.accentShadow : 'none',
          },
          fill,
        ]}
      >
        <Text style={{ ...body(17, 700), color: fg }}>{label}</Text>
        <Symbol name={icon} size={20} color={fg} />
      </Animated.View>
    </PressScale>
  );
}
