import { type Ref, useEffect, useRef, useState } from 'react';
import { Keyboard, Linking, Text, TextInput, type TextInputInstance, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { ListeningRing } from '../voice/listening-ring';
import { useDictation } from '../voice/use-dictation';
import { contextualStrings } from '../voice/voice-support';
import { WaveBars } from '../voice/wave-bars';

/** The longest question the server reads (the request schema's limit). */
const MAX_QUESTION = 300;
/** How long a said question rests in the input, to be read or changed, before it is sent. */
const SEND_SAID_MS = 900;
/** The prototype's `micIn` curve: a pop that overshoots a little. */
const pop = Easing.bezier(0.2, 1.4, 0.4, 1);

function popIn() {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.6 }] },
    animations: {
      opacity: withTiming(1, { duration: 300, easing: pop }),
      transform: [{ scale: withTiming(1, { duration: 300, easing: pop }) }],
    },
  };
}

/** The prototype's `progress_activity` turning once a second while the words are read. */
function Spinner() {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    turn.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(turn);
  }, [reduceMotion, turn]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Animated.View style={spin}>
      <Symbol name="progress_activity" size={18} color={palette.accent} />
    </Animated.View>
  );
}

/**
 * Ask's input. Empty, its button is a microphone: tapped, the bar listens (bars and the words as
 * they come, the end of them in view), stops by itself after a pause or on a second tap, and what
 * was said rests in the input for a moment before it is sent; typing in that moment keeps it there
 * to change. With words typed, the button sends.
 */
export function AskInput({
  onSend,
  disabled,
  inputRef,
}: {
  readonly onSend: (question: string) => void;
  readonly disabled: boolean;
  readonly inputRef: Ref<TextInputInstance>;
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const snap = useMoney();
  const [text, setText] = useState('');
  /** Set by a miss: the placeholder says why until the next try. */
  const [missed, setMissed] = useState<string | null>(null);
  const [asked, setAsked] = useState(false);
  const sendLater = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocked = useRef(disabled);
  blocked.current = disabled;
  const send = useRef(onSend);
  send.current = onSend;

  const holdOff = () => {
    if (sendLater.current) clearTimeout(sendLater.current);
    sendLater.current = null;
  };
  useEffect(() => holdOff, []);

  const dictation = useDictation({
    language,
    contextualStrings: contextualStrings(snap.categories.map((c) => c.name)),
    hold: false,
    onRead: (state) => {
      const said = state.settled.slice(0, MAX_QUESTION);
      setAsked(false);
      setText(said);
      holdOff();
      sendLater.current = setTimeout(() => {
        sendLater.current = null;
        // Still thinking about the last question: the said one waits in the input.
        if (blocked.current) return;
        send.current(said);
        setText('');
      }, SEND_SAID_MS);
    },
  });
  const phase = dictation.state.phase;

  // A miss or a refusal ends the try; the placeholder says why.
  useEffect(() => {
    if (!asked) return;
    if (phase === 'nothing') setMissed(t('voice.nothingTap'));
    else if (phase === 'denied') setMissed(t('voice.denied'));
    else if (phase === 'unavailable') setMissed(null);
    else return;
    setAsked(false);
  }, [asked, phase, t]);

  const voiceOff = phase === 'unavailable';
  const reading = asked && phase === 'finishing';
  const listening = asked && !reading;
  const busy = asked;
  const typed = text.trim() !== '';
  const icon = listening
    ? 'stop'
    : reading
      ? 'more_horiz'
      : typed || voiceOff
        ? 'arrow_upward'
        : 'mic';
  const canSend = typed && !disabled;
  const opacity = reading ? 0.55 : icon === 'arrow_upward' && !canSend ? 0.4 : 1;

  const submit = () => {
    holdOff();
    if (!canSend) return;
    onSend(text);
    setText('');
  };
  const press = () => {
    if (listening) return dictation.stop();
    if (reading) return;
    if (icon === 'arrow_upward') return submit();
    if (phase === 'denied') return void Linking.openSettings();
    Keyboard.dismiss();
    setMissed(null);
    setAsked(true);
    void dictation.start().then((began) => began || setAsked(false));
  };
  const cancel = () => {
    dictation.cancel();
    setAsked(false);
  };

  const buttonFade = useAnimatedStyle(() => ({
    opacity: withTiming(opacity, { duration: 200 }),
  }));
  const inputFade = useAnimatedStyle(() => ({
    opacity: withTiming(busy ? 0 : 1, { duration: 300 }),
  }));
  const ringOn = useSharedValue(0);
  useEffect(() => {
    ringOn.value = withTiming(listening ? 1 : 0, { duration: 350 });
  }, [listening, ringOn]);
  const edge = useAnimatedStyle(() => ({ opacity: ringOn.value }));

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            inset: -2,
            borderRadius: 32,
            borderWidth: 2,
            borderColor: palette.accent,
          },
          edge,
        ]}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 6,
          paddingLeft: 18,
          paddingRight: 6,
          borderRadius: 30,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, height: 40 }}>
          <Animated.View style={[{ flex: 1 }, inputFade]} pointerEvents={busy ? 'none' : 'auto'}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={(next) => {
                holdOff();
                setText(next);
              }}
              onSubmitEditing={submit}
              placeholder={missed ?? t('ask.placeholder')}
              placeholderTextColor={palette.inkSoft}
              returnKeyType="send"
              submitBehavior="submit"
              maxLength={MAX_QUESTION}
              autoCorrect={false}
              selectionColor={palette.accent}
              style={{ flex: 1, padding: 0, fontSize: 16, color: palette.ink }}
            />
          </Animated.View>
          {busy ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{ position: 'absolute', inset: 0 }}
            >
              <PressScale
                scaleTo={1}
                accessibilityRole="button"
                accessibilityLabel={t('voice.cancel')}
                onPress={cancel}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                {listening ? (
                  <WaveBars count={4} width={3} height={20} gap={3} radius={2} />
                ) : (
                  <Spinner />
                )}
                <Text
                  numberOfLines={1}
                  ellipsizeMode="head"
                  style={{
                    ...body(16),
                    flex: 1,
                    color: dictation.transcript === '' ? palette.inkSoft : palette.ink,
                  }}
                >
                  {dictation.transcript === '' ? t('ask.listening') : dictation.transcript}
                </Text>
              </PressScale>
            </Animated.View>
          ) : null}
        </View>
        <View style={{ width: 42, height: 42 }}>
          <ListeningRing on={listening} radius={21} />
          <Animated.View style={[{ flex: 1 }, buttonFade]}>
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={
                listening ? t('voice.stopHint') : icon === 'mic' ? t('ask.speak') : t('ask.send')
              }
              disabled={reading || (icon === 'arrow_upward' && !canSend)}
              onPress={press}
              style={{
                flex: 1,
                borderRadius: 21,
                backgroundColor: palette.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Animated.View key={icon} {...(busy ? {} : { entering: popIn })}>
                <Symbol name={icon} size={22} fill={1} color={palette.accentFg} />
              </Animated.View>
            </PressScale>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
