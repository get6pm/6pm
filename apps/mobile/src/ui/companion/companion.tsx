import { Canvas, Picture, createPicture, matchFont } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { type CompanionForm, type CompanionMood } from './companion-mood';
import { drawCompanion } from './draw-companion';
import { type SleepFonts } from './draw-extras';
import { makeFrame } from './draw-kit';

export interface CompanionProps {
  /** Width and height of the square it is drawn in, in points. */
  readonly size: number;
  readonly mood: CompanionMood;
  readonly form?: CompanionForm;
  /** Serious mode: always the plain, greyscale companion, whatever the mood or form. */
  readonly serious?: boolean;
}

/**
 * With Reduce Motion the companion holds still at this moment of its idle loop: eyes open, the
 * sleepy "z"s and the happy sparkles showing.
 */
const STILL_SECONDS = 2.6;
/** Long past any mood or form change: no hop and no burst. */
const SETTLED_SECONDS = 99;

/** The sleeping "z"s are italic serif, as the prototype's Georgia fallback draws them. */
function sleepFonts(size: number): SleepFonts {
  const fontFamily = Platform.select({ ios: 'Georgia', default: 'serif' });
  return {
    large: matchFont({ fontFamily, fontStyle: 'italic', fontSize: Math.round(size * 0.2) }),
    small: matchFont({ fontFamily, fontStyle: 'italic', fontSize: Math.round(size * 0.13) }),
  };
}

/**
 * The 6pm companion: a little sun dipping into the evening sea. Idle motion (breathing, blinks,
 * swaying rays, the sea's wave, the hand-drawn wobble) runs on the UI thread and freezes with
 * Reduce Motion. Becoming Max plays a burst of light.
 */
export function Companion({ size, mood, form = 'base', serious = false }: CompanionProps) {
  const reduceMotion = useReducedMotion();
  const shownMood: CompanionMood = serious ? 'plain' : mood;
  const [seed] = useState(() => Math.random() * 1000);
  const fonts = useMemo(() => sleepFonts(size), [size]);

  const clock = useSharedValue(0);
  const moodAt = useSharedValue(0);
  const formAt = useSharedValue(-SETTLED_SECONDS);

  useFrameCallback((frame) => {
    clock.value = frame.timeSinceFirstFrame / 1000;
  }, !reduceMotion);

  const lastMood = useRef(shownMood);
  useEffect(() => {
    if (lastMood.current === shownMood) return;
    lastMood.current = shownMood;
    moodAt.value = clock.value;
  }, [shownMood, clock, moodAt]);

  const lastForm = useRef(form);
  useEffect(() => {
    if (lastForm.current === form) return;
    lastForm.current = form;
    formAt.value = clock.value;
  }, [form, clock, formAt]);

  const picture = useDerivedValue(() => {
    const t = clock.value;
    const frame = makeFrame({
      s: size,
      el: reduceMotion ? STILL_SECONDS : t,
      since: reduceMotion ? SETTLED_SECONDS : t - moodAt.value,
      sinceF: reduceMotion ? SETTLED_SECONDS : t - formAt.value,
      mood: shownMood,
      form,
      seed,
    });
    return createPicture((canvas) => drawCompanion(canvas, frame, fonts), {
      width: size,
      height: size,
    });
  });

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Picture picture={picture} />
    </Canvas>
  );
}
