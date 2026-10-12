import { Text } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import { glide } from './glide';
import { MicButton } from './mic-button';
import { OpenSettingsPill } from './open-settings-pill';
import { SpokenChips } from './spoken-chips';
import type { Dictation } from './use-dictation';

/**
 * Quick add's Voice mode: what was heard (streaming while the finger is down), the chips read from
 * it, the hold-to-talk microphone and Save.
 */
export function VoicePanel({
  dictation,
  chips,
  canSave,
  onSave,
}: {
  readonly dictation: Dictation;
  readonly chips: readonly string[];
  readonly canSave: boolean;
  readonly onSave: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { state, transcript, listening } = dictation;
  const phase = state.phase;
  const line =
    phase === 'nothing' ? t('voice.nothing') : phase === 'denied' ? t('voice.denied') : null;
  const said =
    transcript !== ''
      ? phase === 'parsed' || phase === 'noAmount'
        ? `“${transcript}”`
        : transcript
      : listening || line
        ? ''
        : t('voice.prompt');
  const saveOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(canSave ? 1 : 0.35, { duration: 200 }),
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={{ alignItems: 'center', gap: 16, paddingTop: 6 }}
    >
      <Animated.View
        layout={glide}
        style={{ minHeight: 56, maxWidth: 300, justifyContent: 'center' }}
      >
        {said !== '' ? (
          <Text
            style={{
              ...display(24, 500),
              lineHeight: 28.8,
              color: palette.inkSoft,
              textAlign: 'center',
            }}
          >
            {said}
          </Text>
        ) : line ? (
          <Animated.Text
            entering={FadeIn.duration(300)}
            style={{ ...body(15), lineHeight: 21, color: palette.inkSoft, textAlign: 'center' }}
          >
            {line}
          </Animated.Text>
        ) : null}
      </Animated.View>
      {chips.length > 0 ? <SpokenChips key={transcript} chips={chips} /> : null}
      {phase === 'noAmount' ? (
        <Animated.Text
          entering={FadeIn.duration(300)}
          layout={glide}
          style={{ ...body(13), color: palette.inkSoft, textAlign: 'center', marginTop: -6 }}
        >
          {t('voice.noAmount')}
        </Animated.Text>
      ) : null}
      {phase === 'denied' ? <OpenSettingsPill /> : null}
      <Animated.View layout={glide}>
        <MicButton
          size={104}
          glyph={30}
          shadow="0 12px 30px rgba(255,120,70,.35), inset 0 1px 0 rgba(255,255,255,.5)"
          label={listening ? t('voice.listening') : t('voice.hold')}
          hint={t('voice.holdHint')}
          listening={listening}
          onDown={dictation.start}
          onUp={dictation.stop}
        />
      </Animated.View>
      <Animated.View layout={glide} style={[{ alignSelf: 'stretch' }, saveOpacity]}>
        <PressScale
          onPress={onSave}
          disabled={!canSave}
          style={{
            height: 56,
            borderRadius: 99,
            backgroundColor: palette.btnBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(17, 650), color: palette.btnFg }}>{t('voice.save')}</Text>
        </PressScale>
      </Animated.View>
    </Animated.View>
  );
}
