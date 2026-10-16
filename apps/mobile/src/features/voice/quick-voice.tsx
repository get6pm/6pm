import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { curves, voiceInk } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, mono } from '../../ui/type/fonts';
import { ListeningRing } from './listening-ring';
import { OpenSettingsPill } from './open-settings-pill';
import { VoiceShimmer } from './voice-shimmer';
import type { VoiceChip } from './voice-support';
import { mainAction, type VoiceStage } from './voice-stage';
import { WaveBars } from './wave-bars';

const enter = Easing.bezier(...curves.enter);
/** The prototype's `micIn` curve: a pop that overshoots a little. */
const pop = Easing.bezier(0.2, 1.4, 0.4, 1);

/** `micIn`: scaled from .6 and faded in, after `delay` ms. */
function popIn(duration: number, delay = 0) {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ scale: 0.6 }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, { duration, easing: pop })),
        transform: [{ scale: withDelay(delay, withTiming(1, { duration, easing: pop })) }],
      },
    };
  };
}

/**
 * The keypad and the voice panel in one place: the keypad steps back (fading, shrinking a little,
 * dropping 6 pt) while the panel comes forward over it, and the other way when the panel closes.
 */
export function useVoiceSwap(open: boolean) {
  const shown = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    shown.value = open ? 1 : 0;
  }, [open, shown]);
  const keypad = useAnimatedStyle(() => ({
    opacity: withTiming(1 - shown.value, { duration: 350 }),
    transform: [
      { translateY: withTiming(6 * shown.value, { duration: 450, easing: enter }) },
      { scale: withTiming(1 - 0.04 * shown.value, { duration: 450, easing: enter }) },
    ],
  }));
  const panel = useAnimatedStyle(() => ({
    opacity: withTiming(shown.value, { duration: 350 }),
    transform: [
      { translateY: withTiming(10 * (1 - shown.value), { duration: 450, easing: enter }) },
      { scale: withTiming(0.96 + 0.04 * shown.value, { duration: 450, easing: enter }) },
    ],
  }));
  return { keypad, panel };
}

/** The panel's words for a stage it cannot carry on from: why, in a sentence. */
function stuckLine(
  stage: VoiceStage,
  t: ReturnType<typeof useI18n>['t'],
  language: 'en' | 'vi',
): string | null {
  if (stage === 'nothing') return t('voice.nothingTap');
  if (stage === 'noAmount') return t('voice.noAmount');
  if (stage === 'denied') return t('voice.denied');
  if (stage === 'unavailable') {
    return t('voice.unavailable', { language: t(`voice.language.${language}`) });
  }
  return null;
}

/**
 * What quick add hears, over the keypad: a status line, the words (streaming while listening,
 * quoted once read), and under them the bars, the reading sweep or the chips read from them.
 */
export function QuickVoicePanel({
  stage,
  transcript,
  chips,
}: {
  readonly stage: VoiceStage;
  readonly transcript: string;
  readonly chips: readonly VoiceChip[];
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  // While the panel fades out it keeps showing what it showed last.
  const last = useRef<VoiceStage>('waiting');
  if (stage !== 'closed') last.current = stage;
  const shown = last.current;
  const stuck = stuckLine(shown, t, language);
  const hearing = shown === 'waiting' || shown === 'listening';
  const title = hearing
    ? t('voice.listening')
    : shown === 'reading'
      ? t('voice.reading')
      : shown === 'heard'
        ? t('voice.gotIt')
        : null;
  const said =
    transcript === ''
      ? hearing
        ? t('voice.promptTap')
        : ''
      : hearing
        ? transcript
        : `“${transcript}”`;
  const saidInk = transcript !== '' && shown !== 'reading' ? palette.ink : palette.inkSoft;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
      }}
    >
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: shown === 'heard' ? voiceInk.heard : palette.accent,
            }}
          />
          <Text
            style={{
              ...mono(10.5, 400, 0.14),
              textTransform: 'uppercase',
              color: palette.inkSoft,
            }}
          >
            {title}
          </Text>
        </View>
      ) : null}
      {said !== '' ? (
        <View style={{ minHeight: stuck ? 0 : 58, maxWidth: 300, justifyContent: 'center' }}>
          <Text
            numberOfLines={2}
            style={{ ...leading(display(23, 500), 28.75), color: saidInk, textAlign: 'center' }}
          >
            {said}
          </Text>
        </View>
      ) : null}
      {stuck ? (
        <Animated.Text
          key={shown}
          entering={FadeIn.duration(300)}
          style={{
            ...body(15),
            lineHeight: 21,
            maxWidth: 300,
            color: palette.inkSoft,
            textAlign: 'center',
          }}
        >
          {stuck}
        </Animated.Text>
      ) : null}
      {shown === 'denied' ? <OpenSettingsPill /> : null}
      {hearing ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ height: 28 }}>
          <WaveBars count={7} width={4} height={28} gap={4} radius={3} />
        </Animated.View>
      ) : shown === 'reading' ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{ height: 28, justifyContent: 'center' }}
        >
          <VoiceShimmer />
        </Animated.View>
      ) : shown === 'heard' ? (
        <View key={transcript} style={{ height: 28, flexDirection: 'row', gap: 6 }}>
          {chips.map((chip, i) => (
            <Animated.View
              key={`${i}-${chip.label}`}
              entering={popIn(400, i * 80)}
              style={{
                height: 28,
                paddingHorizontal: 11,
                borderRadius: 14,
                backgroundColor: palette.accent,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Symbol name={chip.icon} size={14} fill={1} color={palette.accentFg} />
              <Text numberOfLines={1} style={{ ...body(12.5, 650), color: palette.accentFg }}>
                {chip.label}
              </Text>
            </Animated.View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The square microphone beside the main button. Tapped, it listens; while listening it stops;
 * it takes the accent while the panel is open and pulses a ring while it hears.
 */
export function QuickMic({
  stage,
  onPress,
}: {
  readonly stage: VoiceStage;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const open = stage !== 'closed';
  const listening = stage === 'listening';
  const icon =
    stage === 'listening' || stage === 'waiting'
      ? 'stop'
      : stage === 'reading'
        ? 'more_horiz'
        : stage === 'heard'
          ? 'check'
          : 'mic';
  const on = useSharedValue(open ? 1 : 0);
  const glow = useSharedValue(0);
  useEffect(() => {
    on.value = withTiming(open ? 1 : 0, { duration: 300 });
    glow.value = withTiming(listening ? 1 : 0, { duration: 300 });
  }, [open, listening, on, glow]);

  const face = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [palette.chipBg, palette.accent]),
  }));
  const shadow = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ width: 56, height: 56 }}>
      <ListeningRing on={listening} radius={18} />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            inset: 0,
            borderRadius: 18,
            backgroundColor: palette.accent,
            boxShadow: voiceInk.listeningGlow,
          },
          shadow,
        ]}
      />
      <PressScale
        scaleTo={0.93}
        accessibilityRole="button"
        accessibilityLabel={listening ? t('voice.stopHint') : t('voice.micHint')}
        accessibilityState={{ busy: listening }}
        onPress={onPress}
        style={{ width: 56, height: 56 }}
      >
        <Animated.View
          style={[
            {
              flex: 1,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
            },
            face,
          ]}
        >
          <Animated.View key={icon} {...(open ? { entering: popIn(300) } : {})}>
            <Symbol name={icon} size={26} fill={1} color={open ? palette.accentFg : palette.ink} />
          </Animated.View>
        </Animated.View>
      </PressScale>
    </View>
  );
}

/**
 * The wide button beside the microphone: Keep it from the keypad, Done talking while listening,
 * Cancel while the words are read or something stops voice. It dims while there is nothing to keep
 * and while the words are being read.
 */
export function QuickMainButton({
  stage,
  canKeep,
  onPress,
}: {
  readonly stage: VoiceStage;
  readonly canKeep: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const action = mainAction(stage);
  const opacity =
    stage === 'reading' || stage === 'heard' ? 0.5 : action === 'keep' && !canKeep ? 0.35 : 1;
  const fade = useAnimatedStyle(() => ({ opacity: withTiming(opacity, { duration: 250 }) }));
  const [icon, label] =
    action === 'keep'
      ? (['receipt_long', t('quick.keep')] as const)
      : action === 'stop'
        ? (['check', t('voice.doneTalking')] as const)
        : (['close', t('voice.cancel')] as const);
  return (
    <Animated.View style={[{ flex: 1 }, fade]}>
      <PressScale
        scaleTo={0.97}
        onPress={onPress}
        disabled={action === 'keep' && !canKeep}
        style={{
          height: 56,
          borderRadius: 18,
          backgroundColor: palette.btnBg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Symbol name={icon} size={20} color={palette.btnFg} />
        <Text style={{ ...body(17, 650), color: palette.btnFg }}>{label}</Text>
      </PressScale>
    </Animated.View>
  );
}
