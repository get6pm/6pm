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
import { makeFrame } from './draw-kit';

export interface CompanionProps {
  /** Width and height of the square it is drawn in, in points. */
  readonly size: number;
  readonly mood: CompanionMood;
  /** Defaults to the form the app gives every companion: Max for members. */
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
const fadeEase = Easing.bezier(...curves.enter);

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
 * Reduce Motion, and also while the screen around it is not showing it (a hidden tab, a screen
 * covered by a takeover). Becoming Max plays a burst of light; leaving Max fades the Max form out
 * over the base one.
 */
export function Companion({ size, mood, form: asked, serious = false }: CompanionProps) {
  const given = useCompanionForm();
  const form = asked ?? given;
  const reduceMotion = useReducedMotion();
  const shownMood: CompanionMood = serious ? 'plain' : mood;
  const [seed] = useState(() => Math.random() * 1000);
  const fonts = useMemo(() => sleepFonts(size), [size]);

  const clock = useSharedValue(0);
  const moodAt = useSharedValue(0);
  const formAt = useSharedValue(-SETTLED_SECONDS);
  /** How much of the Max form still shows over the base one after Max ends. */
  const leaving = useSharedValue(0);

  const box = useAnimatedRef<Animated.View>();
  const window = useWindowDimensions();
  const tick = useCallback(
    (frame: FrameInfo) => {
      'worklet';
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
      // Added up frame by frame so a pause does not send the clock back to zero.
      clock.value += (frame.timeSincePreviousFrame ?? 0) / 1000;
    },
    [clock, box, window.width, window.height],
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
    const wasMax = lastForm.current === 'max';
    lastForm.current = form;
    formAt.value = clock.value;
    leaving.value = wasMax
      ? withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0, { duration: durations.screen, easing: fadeEase }),
        )
      : 0;
  }, [form, clock, formAt, leaving]);

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
        drawCompanion(canvas, makeFrame({ ...input, form: 'max', sinceF: SETTLED_SECONDS }), fonts);
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
