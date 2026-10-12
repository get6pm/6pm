import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { formatVnd } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import type { DictationState } from './dictation-state';
import { MicButton } from './mic-button';
import { OpenSettingsPill } from './open-settings-pill';
import { useDictation } from './use-dictation';
import { contextualStrings } from './voice-support';

/** A press held this long is a hold: lifting the finger stops listening. */
const HOLD_MS = 450;

/** A cash spend said in the close, ready for the cash list. */
export interface SaidCash {
  /** The starter category the words point to, when they do. */
  readonly categoryHint: string | null;
  readonly name: string;
  readonly amount: number;
}

/**
 * The close's "Say it": tap and say it (it stops after a pause, or on a second tap), or hold it
 * and let go. What was heard streams under the microphone, then reads as "Veggies & eggs ·
 * 35.000₫" once it is added.
 */
export function CashVoice({ onSaid }: { readonly onSaid: (cash: SaidCash) => void }) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const snap = useMoney();
  const [added, setAdded] = useState('');
  const press = useRef({ at: 0, wasListening: false });

  const onRead = (state: DictationState) => {
    const spend = state.spend;
    if (state.phase !== 'parsed' || !spend || spend.amount === null) return;
    const category = snap.categories.find((c) => c.id === spend.categoryHint);
    const name = spend.name || category?.name || t('source.cash');
    setAdded(`${name} · ${formatVnd(spend.amount)}`);
    onSaid({ categoryHint: spend.categoryHint, name, amount: spend.amount });
  };
  const dictation = useDictation({
    language,
    contextualStrings: contextualStrings(snap.categories.map((c) => c.name)),
    hold: false,
    onRead,
  });
  const { state, transcript, listening } = dictation;
  const phase = state.phase;

  const line =
    phase === 'unavailable'
      ? t('voice.unavailable', { language: t(`voice.language.${language}`) })
      : phase === 'denied'
        ? t('voice.denied')
        : phase === 'nothing'
          ? t('voice.nothingTap')
          : phase === 'noAmount'
            ? t('voice.noAmount')
            : null;
  const said = listening ? transcript : phase === 'parsed' ? added : '';

  return (
    <View style={{ alignItems: 'center', gap: 14, paddingTop: 14, paddingBottom: 4 }}>
      <MicButton
        size={112}
        glyph={32}
        shadow="0 14px 34px rgba(255,120,70,.38), inset 0 1px 0 rgba(255,255,255,.5)"
        label={listening ? t('voice.listening') : t('voice.sayIt')}
        hint={t('voice.tapHint')}
        listening={listening}
        disabled={phase === 'unavailable'}
        onDown={() => {
          press.current = { at: Date.now(), wasListening: listening };
          if (!listening) dictation.start();
        }}
        onUp={() => {
          const { at, wasListening } = press.current;
          if (wasListening || Date.now() - at >= HOLD_MS) dictation.stop();
        }}
      />
      <View style={{ minHeight: 30, maxWidth: 310, justifyContent: 'center' }}>
        {said !== '' ? (
          <Text style={{ ...display(22, 500), color: palette.inkSoft, textAlign: 'center' }}>
            {said}
          </Text>
        ) : line ? (
          <Animated.Text
            key={phase}
            entering={FadeIn.duration(300)}
            style={{ ...body(15), lineHeight: 21, color: palette.inkSoft, textAlign: 'center' }}
          >
            {line}
          </Animated.Text>
        ) : null}
      </View>
      {phase === 'denied' ? <OpenSettingsPill /> : null}
    </View>
  );
}
