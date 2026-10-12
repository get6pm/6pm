import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Language } from '@6pm/i18n';

import { haptics } from '../../ui/haptics';
import {
  dictationReducer,
  heardText,
  initialDictation,
  isRead,
  type DictationEvent,
  type DictationState,
} from './dictation-state';
import { offersLocale, speechLocale } from './voice-support';

/** Locales that failed to start on this iPhone without a server; asked again on the next launch. */
const failedLocales = new Set<string>();

export interface Dictation {
  readonly state: DictationState;
  /** Everything heard so far, streaming while the user speaks. */
  readonly transcript: string;
  /** True from the start of listening until the recogniser lets go. */
  readonly listening: boolean;
  /** Asks for the microphone if needed, then listens. */
  readonly start: () => void;
  /** Stops listening; the last words arrive, then they are read. */
  readonly stop: () => void;
}

/**
 * Speech to a spend, on this iPhone only: the recogniser is told it must not use a server, so
 * audio never leaves the phone. `hold` listens for as long as the finger is down; otherwise the
 * recogniser stops by itself after a pause.
 */
export function useDictation({
  language,
  contextualStrings,
  hold,
  onRead,
}: {
  readonly language: Language;
  readonly contextualStrings: readonly string[];
  readonly hold: boolean;
  /** Called once when what was said has been read (an amount or not). */
  readonly onRead: (state: DictationState) => void;
}): Dictation {
  const locale = speechLocale(language);
  const [state, setState] = useState(initialDictation);
  const [listening, setListening] = useState(false);
  const current = useRef(state);
  const live = useRef(false);
  const pressing = useRef(false);
  const read = useRef(onRead);
  const words = useRef(contextualStrings);
  useEffect(() => {
    read.current = onRead;
    words.current = contextualStrings;
  });

  const apply = useCallback((event: DictationEvent) => {
    const before = current.current;
    const next = dictationReducer(before, event);
    if (next === before) return;
    current.current = next;
    setState(next);
    if (isRead(next.phase) && !isRead(before.phase)) {
      haptics.tap();
      read.current(next);
    }
  }, []);

  const letGo = useCallback(() => {
    live.current = false;
    setListening(false);
  }, []);

  useEffect(() => {
    let on = true;
    const check = async () => {
      if (failedLocales.has(locale)) return apply({ type: 'unavailable' });
      if (!ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) {
        return apply({ type: 'unavailable' });
      }
      const { locales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
      if (!on) return;
      if (!offersLocale(locales, locale)) return apply({ type: 'unavailable' });
      const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (on && !permission.granted && !permission.canAskAgain) apply({ type: 'denied' });
    };
    check().catch(() => on && apply({ type: 'unavailable' }));
    return () => {
      on = false;
      if (live.current) ExpoSpeechRecognitionModule.abort();
      live.current = false;
    };
  }, [locale, apply]);

  useSpeechRecognitionEvent('result', (event) => {
    if (!live.current) return;
    apply({ type: 'heard', text: event.results[0]?.transcript ?? '', final: event.isFinal });
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (!live.current) return;
    if (event.error === 'language-not-supported' || event.error === 'service-not-allowed') {
      failedLocales.add(locale);
    }
    apply({ type: 'failed', error: event.error });
    if (current.current.phase !== 'listening' && current.current.phase !== 'finishing') letGo();
  });
  useSpeechRecognitionEvent('end', () => {
    if (!live.current) return;
    letGo();
    apply({ type: 'end' });
  });

  const start = useCallback(() => {
    if (live.current || current.current.phase === 'unavailable') return;
    pressing.current = true;
    const begin = async () => {
      let permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) return apply({ type: 'denied' });
        permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) {
          return apply(permission.canAskAgain ? { type: 'reset' } : { type: 'denied' });
        }
        // The prompt took the finger off the button: the next hold listens.
        if (hold) return apply({ type: 'reset' });
      }
      if ((hold && !pressing.current) || live.current) return;
      live.current = true;
      setListening(true);
      haptics.tick();
      apply({ type: 'start' });
      ExpoSpeechRecognitionModule.start({
        lang: locale,
        interimResults: true,
        requiresOnDeviceRecognition: true,
        addsPunctuation: true,
        continuous: hold,
        contextualStrings: [...words.current],
        iosTaskHint: 'dictation',
      });
    };
    begin().catch(() => {
      letGo();
      apply({ type: 'failed', error: 'audio-capture' });
    });
  }, [apply, hold, letGo, locale]);

  const stop = useCallback(() => {
    pressing.current = false;
    if (!live.current) return;
    apply({ type: 'release' });
    ExpoSpeechRecognitionModule.stop();
  }, [apply]);

  return { state, transcript: heardText(state), listening, start, stop };
}
