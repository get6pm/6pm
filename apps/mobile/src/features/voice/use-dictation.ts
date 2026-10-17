import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { allowanceDayOf } from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import { micStream } from '../../../modules/mic-stream';
import { useMoneyStore } from '../../data/money-provider';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { useApi } from '../api/native-api';
import { readAiMode } from '../privacy/ai-mode';
import { useEntitlement } from '../purchases/purchases-provider';
import { cloudVoiceUsed, recordCloudVoice, voiceSource } from './cloud-allowance';
import { listenInCloud, type CloudListener } from './cloud-listener';
import {
  dictationReducer,
  heardText,
  initialDictation,
  isRead,
  type DictationEvent,
  type DictationState,
} from './dictation-state';
import { hearsOnPhone, speechLocale } from './voice-support';

/** Locales that failed to start on this phone without a server; asked again on the next launch. */
const failedLocales = new Set<string>();

export interface Dictation {
  readonly state: DictationState;
  /** Everything heard so far, streaming while the user speaks. */
  readonly transcript: string;
  /** True from the start of listening until the recogniser lets go. */
  readonly listening: boolean;
  /**
   * Asks for the microphone if needed, then listens. Resolves to false when the try ended with
   * nothing to show (the prompt was dismissed, or it was stopped before it began): the phase is
   * back to idle.
   */
  readonly start: () => Promise<boolean>;
  /** Stops listening; the last words arrive, then they are read. */
  readonly stop: () => void;
  /** Stops listening and drops what was heard: nothing is read. */
  readonly cancel: () => void;
}

/**
 * Speech to a spend. In server mode the audio streams to the cloud transcriber (Free: ten a day);
 * in on-device mode, offline, past the allowance, or when the cloud fails before any words,
 * the phone's own recogniser hears it (Apple's, or Android's with the language downloaded), told
 * it must not use a server. `hold` listens for as long as the finger is down; otherwise listening
 * stops by itself after a pause.
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
  const db = useSQLiteContext();
  const store = useMoneyStore();
  const api = useApi();
  const { max } = useEntitlement();
  // Cloud transcriptions are counted on the phone's calendar day: they come back at local midnight.
  const allowanceDay = allowanceDayOf(useClock().now);
  const [state, setState] = useState(initialDictation);
  const [listening, setListening] = useState(false);
  const current = useRef(state);
  const live = useRef(false);
  const pressing = useRef(false);
  /** Listening was stopped before a recogniser was chosen: it stops as soon as it starts. */
  const stopAsked = useRef(false);
  /** Who is hearing the words now. */
  const source = useRef<'apple' | 'cloud' | null>(null);
  const cloud = useRef<CloudListener | null>(null);
  /** Whether the phone's own recogniser can hear this language without a server. */
  const appleReady = useRef(false);
  const read = useRef(onRead);
  const words = useRef(contextualStrings);
  const now = useRef({ max, allowanceDay });
  useEffect(() => {
    read.current = onRead;
    words.current = contextualStrings;
    now.current = { max, allowanceDay };
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
    source.current = null;
    setListening(false);
  }, []);

  useEffect(() => {
    let on = true;
    const check = async () => {
      const onDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      const ready =
        !failedLocales.has(locale) &&
        onDevice &&
        hearsOnPhone({
          os: Platform.OS === 'android' ? 'android' : 'ios',
          apiLevel: typeof Platform.Version === 'number' ? Platform.Version : 0,
          onDevice,
          supported: await ExpoSpeechRecognitionModule.getSupportedLocales({}),
          locale,
        });
      if (!on) return;
      appleReady.current = ready;
      // The cloud transcriber hears what Apple's cannot, in server mode.
      if (!ready && (readAiMode(db) === 'device' || !micStream))
        return apply({ type: 'unavailable' });
      const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (on && !permission.granted && !permission.canAskAgain) apply({ type: 'denied' });
    };
    check().catch(() => on && apply({ type: 'unavailable' }));
    return () => {
      on = false;
      cloud.current?.abort();
      cloud.current = null;
      if (live.current && source.current === 'apple') ExpoSpeechRecognitionModule.abort();
      live.current = false;
    };
  }, [locale, apply, db]);

  const fromApple = () => live.current && source.current === 'apple';
  useSpeechRecognitionEvent('result', (event) => {
    if (!fromApple()) return;
    apply({ type: 'heard', text: event.results[0]?.transcript ?? '', final: event.isFinal });
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (!fromApple()) return;
    if (event.error === 'language-not-supported' || event.error === 'service-not-allowed') {
      failedLocales.add(locale);
    }
    apply({ type: 'failed', error: event.error });
    if (current.current.phase !== 'listening' && current.current.phase !== 'finishing') letGo();
  });
  useSpeechRecognitionEvent('end', () => {
    if (!fromApple()) return;
    letGo();
    apply({ type: 'end' });
  });

  const stopSource = useCallback(() => {
    if (source.current === 'cloud') cloud.current?.stop();
    else if (source.current === 'apple') ExpoSpeechRecognitionModule.stop();
  }, []);

  const listenOnPhone = useCallback(() => {
    source.current = 'apple';
    ExpoSpeechRecognitionModule.start({
      lang: locale,
      interimResults: true,
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
      continuous: hold,
      contextualStrings: [...words.current],
      iosTaskHint: 'dictation',
    });
  }, [hold, locale]);

  /** Who hears this one: `voiceSource` with the mode, the plan and the count for today. */
  const chooseSource = useCallback(async () => {
    const mode = readAiMode(db);
    const { max: isMax, allowanceDay: day } = now.current;
    const usedToday = mode === 'server' && !isMax ? await cloudVoiceUsed(store.db, day) : 0;
    return voiceSource({
      mode,
      streams: micStream !== null,
      max: isMax,
      usedToday,
      appleReady: appleReady.current,
    });
  }, [db, store]);

  const listenInTheCloud = useCallback(() => {
    source.current = 'cloud';
    cloud.current = listenInCloud({
      request: api.request.bind(api),
      language,
      hold,
      minted: () =>
        void recordCloudVoice(store.db, now.current.allowanceDay).catch(() => undefined),
      events: {
        heard: (text, final) => live.current && apply({ type: 'heard', text, final }),
        ended: () => {
          cloud.current = null;
          if (!live.current) return;
          letGo();
          apply({ type: 'end' });
        },
        failed: () => {
          cloud.current = null;
          if (!live.current) return;
          // Still listening and Apple's recogniser can hear it: it takes over, unseen.
          if (current.current.phase === 'listening' && appleReady.current) {
            listenOnPhone();
            if (stopAsked.current) stopSource();
            return;
          }
          letGo();
          apply(
            current.current.phase === 'finishing'
              ? { type: 'end' }
              : { type: 'failed', error: 'network' },
          );
        },
      },
    });
  }, [api, apply, hold, language, letGo, listenOnPhone, stopSource, store]);

  const start = useCallback(async (): Promise<boolean> => {
    if (live.current || current.current.phase === 'unavailable') return false;
    pressing.current = true;
    stopAsked.current = false;
    // What the last try heard goes at once, before the microphone is asked for.
    apply({ type: 'reset' });
    const begin = async (): Promise<boolean> => {
      let permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          apply({ type: 'denied' });
          return true;
        }
        permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) {
          apply(permission.canAskAgain ? { type: 'reset' } : { type: 'denied' });
          return !permission.canAskAgain;
        }
        // The prompt took the finger off the button: the next hold listens.
        if (hold) {
          apply({ type: 'reset' });
          return false;
        }
      }
      // Let go, stopped or cancelled while the permission was asked: nothing starts.
      if (!pressing.current || live.current) return false;
      live.current = true;
      setListening(true);
      haptics.tick();
      apply({ type: 'start' });
      const chosen = await chooseSource().catch(() => (appleReady.current ? 'apple' : null));
      if (!live.current) return true;
      if (chosen === 'cloud') listenInTheCloud();
      else if (chosen === 'apple') listenOnPhone();
      else {
        letGo();
        apply({ type: 'failed', error: 'language-not-supported' });
        return true;
      }
      if (stopAsked.current) stopSource();
      return true;
    };
    return begin().catch(() => {
      letGo();
      apply({ type: 'failed', error: 'audio-capture' });
      return true;
    });
  }, [apply, hold, letGo, listenInTheCloud, listenOnPhone, chooseSource, stopSource]);

  const stop = useCallback(() => {
    pressing.current = false;
    if (!live.current) return;
    apply({ type: 'release' });
    stopAsked.current = true;
    stopSource();
  }, [apply, stopSource]);

  const cancel = useCallback(() => {
    pressing.current = false;
    stopAsked.current = false;
    if (live.current) {
      if (source.current === 'cloud') cloud.current?.abort();
      else if (source.current === 'apple') ExpoSpeechRecognitionModule.abort();
      cloud.current = null;
      letGo();
    }
    apply({ type: 'reset' });
  }, [apply, letGo]);

  return { state, transcript: heardText(state), listening, start, stop, cancel };
}
