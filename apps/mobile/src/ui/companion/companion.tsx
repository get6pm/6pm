import { Canvas, Picture, Skia, createPicture, matchFont } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  measure,
  useAnimatedRef,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type FrameInfo,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

import { useGatedFrameCallback, useScreenActivity } from '../sky/screen-activity';
import { useCompanionForm } from './companion-form';
import { type CompanionForm, type CompanionMood } from './companion-mood';
import { drawCompanion } from './draw-companion';
import { type SleepFonts } from './draw-extras';
import { makeFrame } from './make-frame';

export interface CompanionProps {
  /** Width and height of the square it is drawn in, in points. */
  readonly size: number;
  readonly mood: CompanionMood;
  /** Defaults to the form the app gives every companion: Max for members. */
  readonly form?: CompanionForm;
  /** Serious mode: always the plain, greyscale companion, whatever the mood or form. */
  readonly serious?: boolean;
  /** Each new value plays the form's arrival again, as when it was just chosen. */
  readonly cue?: number;
}

/**
 * With Reduce Motion the companion holds still at this moment of its idle loop: eyes open, the
 * sleepy "z"s and the happy sparkles showing.
 */
const STILL_SECONDS = 2.6;
/** Long past any mood or form change: no hop and no burst. */
const SETTLED_SECONDS = 99;
const fadeEase = Easing.bezier(...curves.enter);
/** Idle motion steps 30 times a second. */
const IDLE_STEP_SECONDS = 1 / 30;
/** For this long after a mood, form or cue change it moves at the display's full rate. */
const LIVELY_SECONDS = 2;

/** The sleeping "z"s are italic serif, as the prototype's Georgia fallback draws them. */
function sleepFonts(size: number): SleepFonts {
  const fontFamily = Platform.select({ ios: 'Georgia', default: 'serif' });
  return {
    large: matchFont({ fontFamily, fontStyle: 'italic', fontSize: Math.round(size * 0.2) }),
    small: matchFont({ fontFamily, fontStyle: 'italic', fontSize: Math.round(size * 0.13) }),
  };
}

/**
 * The 6pm companion: the little sun dipping into the evening sea, or whichever form the person
 * chose. Idle motion (breathing, blinks, hair, the hand-drawn wobble) runs on the UI thread and
 * freezes with Reduce Motion, and also while the screen around it is not showing it (a hidden tab,
 * a screen covered by a takeover). Arriving in a form plays that form's entrance (Max's burst of
 * light, the crane unfolding, …) while the form it leaves fades out over it.
 */
export function Companion({ size, mood, form: asked, serious = false, cue = 0 }: CompanionProps) {
  const given = useCompanionForm();
  const form = asked ?? given;
  const reduceMotion = useReducedMotion();
  const shownMood: CompanionMood = serious ? 'plain' : mood;
  const [seed] = useState(() => Math.random() * 1000);
  const fonts = useMemo(() => sleepFonts(size), [size]);

  const clock = useSharedValue(0);
  const moodAt = useSharedValue(0);
  const formAt = useSharedValue(-SETTLED_SECONDS);
  /** The form being left, and how much of it still shows over the new one. */
  const leftForm = useSharedValue<CompanionForm>(form);
  const leaving = useSharedValue(0);

  const box = useAnimatedRef<Animated.View>();
  const window = useWindowDimensions();
  const pending = useSharedValue(0);
  const tick = useCallback(
    (frame: FrameInfo) => {
      'worklet';
      // Added up frame by frame so a pause does not send the clock back to zero.
      const waited = pending.value + (frame.timeSincePreviousFrame ?? 0) / 1000;
      // Idle, it steps 30 times a second (breathing and blinks look the same as at 120, and each
      // step draws it again); an arrival or a new mood plays at the display's full rate.
      const settled = clock.value - Math.max(moodAt.value, formAt.value) > LIVELY_SECONDS;
      if (settled && waited < IDLE_STEP_SECONDS - 0.001) {
        pending.value = waited;
        return;
      }
      pending.value = 0;
      // Scrolled out of sight (a long sheet, the Today list), it holds still: drawing a canvas
      // nobody sees costs every frame, and one taken off screen can stall the UI thread waiting
      // for a surface to draw into.
      const at = measure(box);
      if (
        at !== null &&
        (at.pageY >= window.height ||
          at.pageY + at.height <= 0 ||
          at.pageX >= window.width ||
          at.pageX + at.width <= 0)
      ) {
        return;
      }
      clock.value += waited;
    },
    [clock, moodAt, formAt, pending, box, window.width, window.height],
  );
  useGatedFrameCallback(tick, !reduceMotion, useScreenActivity());

  const lastMood = useRef(shownMood);
  useEffect(() => {
    if (lastMood.current === shownMood) return;
    lastMood.current = shownMood;
    moodAt.value = clock.value;
  }, [shownMood, clock, moodAt]);

  const lastForm = useRef(form);
  useEffect(() => {
    if (lastForm.current === form) return;
    leftForm.value = lastForm.current;
    lastForm.current = form;
    formAt.value = clock.value;
    leaving.value = withSequence(
      withTiming(1, { duration: 0 }),
      withTiming(0, { duration: durations.screen, easing: fadeEase }),
    );
  }, [form, clock, formAt, leaving, leftForm]);

  const lastCue = useRef(cue);
  useEffect(() => {
    if (lastCue.current === cue) return;
    lastCue.current = cue;
    formAt.value = clock.value;
  }, [cue, clock, formAt]);

  const picture = useDerivedValue(() => {
    const t = clock.value;
    const input = {
      s: size,
      el: reduceMotion ? STILL_SECONDS : t,
      since: reduceMotion ? SETTLED_SECONDS : t - moodAt.value,
      sinceF: reduceMotion ? SETTLED_SECONDS : t - formAt.value,
      mood: shownMood,
      form,
      seed,
    };
    const frame = makeFrame(input);
    const fade = leaving.value;
    return createPicture(
      (canvas) => {
        drawCompanion(canvas, frame, fonts);
        if (fade <= 0) return;
        const layer = Skia.Paint();
        layer.setAlphaf(fade);
        canvas.saveLayer(layer);
        const left = { ...input, form: leftForm.value, sinceF: SETTLED_SECONDS };
        drawCompanion(canvas, makeFrame(left), fonts);
        canvas.restore();
      },
      { width: size, height: size },
    );
  });

  return (
    <Animated.View ref={box} style={{ width: size, height: size }} pointerEvents="none">
      <Canvas style={{ width: size, height: size }} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>
    </Animated.View>
  );
}
