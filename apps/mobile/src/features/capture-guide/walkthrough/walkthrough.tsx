import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useI18n } from '../../../i18n/i18n';
import { haptics } from '../../../ui/haptics';
import { followFinger, landingPage } from '../../home/pager';
import { PressScale } from '../../../ui/primitives/press-scale';
import { useTheme } from '../../../ui/theme/theme';
import { body } from '../../../ui/type/fonts';

/** One step: what to do, in words, and the screen it happens on, drawn and playing on `t`. */
export interface WalkthroughStep {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** How long the drawn screen's loop runs, in milliseconds. */
  readonly loop: number;
  /** Where on its loop the screen holds still with Reduce Motion: the finger on the step's tap. */
  readonly still: number;
  readonly frame: (t: SharedValue<number>, size: FrameSize) => ReactNode;
}

/** The room a drawn screen gets: its width on screen and the phone's scale for it. */
export interface FrameSize {
  readonly width: number;
  readonly phoneScale: number;
  readonly browserScale: number;
}

/** A page lands at the finger's speed and never bounces past it. */
const LAND = { duration: 320, dampingRatio: 1, overshootClamping: true } as const;
const SWIPE_START = 12;
/** A title line and four lines of detail. */
const CAPTION_HEIGHT = 112;

/**
 * A setup told as drawn screens: one step a page, swiped or stepped through with Back and Next.
 * The page on show plays its screen on a loop; with Reduce Motion every screen holds its end state.
 */
export function Walkthrough({ steps }: { readonly steps: readonly WalkthroughStep[] }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const still = useReducedMotion();
  const window = useWindowDimensions();
  const width = window.width - 32;
  const size: FrameSize = {
    width,
    phoneScale: Math.min(222, width * 0.62) / 402,
    browserScale: (width - 28) / 600,
  };
  const last = steps.length - 1;
  const [index, setIndex] = useState(0);
  const position = useSharedValue(0);
  const grab = useSharedValue(0);
  const fade = useSharedValue(1);

  const land = useCallback(
    (to: number) => {
      if (to === index) return;
      haptics.tick();
      setIndex(to);
    },
    [index],
  );

  const go = (to: number) => {
    const next = Math.max(0, Math.min(last, to));
    if (still) {
      // No sliding: the next page fades in where this one was.
      position.set(next);
      fade.set(0);
      fade.set(withTiming(1, { duration: 200, reduceMotion: ReduceMotion.Never }));
    } else {
      position.set(withSpring(next, { ...LAND, reduceMotion: ReduceMotion.Never }));
    }
    land(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-SWIPE_START, SWIPE_START])
    .failOffsetY([-SWIPE_START, SWIPE_START])
    .onBegin(() => {
      cancelAnimation(position);
      grab.set(position.get());
    })
    .onUpdate((e) => {
      position.set(followFinger(grab.get() - e.translationX / width, 0, last, width));
    })
    .onEnd((e) => {
      const to = landingPage({
        position: position.get(),
        velocity: e.velocityX,
        width,
        current: Math.round(grab.get()),
        lo: 0,
        hi: last,
      });
      position.set(
        withSpring(to, {
          ...LAND,
          velocity: -e.velocityX / width,
          reduceMotion: ReduceMotion.Never,
        }),
      );
      scheduleOnRN(land, to);
    });

  const track = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ translateX: -position.get() * width }],
  }));

  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        overflow: 'hidden',
        paddingTop: 16,
        paddingBottom: 14,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingBottom: 14,
        }}
      >
        <Text
          style={{ ...body(13, 600, 0.04), color: palette.inkSoft, textTransform: 'uppercase' }}
        >
          {t('capture.walk.stepOf', { step: index + 1, total: steps.length })}
        </Text>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {steps.map((step, k) => (
            <Dot key={step.id} index={k} position={position} />
          ))}
        </View>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flexDirection: 'row', width: width * steps.length }, track]}>
          {steps.map((step, k) => (
            <Page
              key={step.id}
              step={step}
              size={size}
              active={k === index}
              still={still}
              number={k + 1}
            />
          ))}
        </Animated.View>
      </GestureDetector>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 4 }}>
        <StepButton
          label={t('capture.walk.back')}
          disabled={index === 0}
          onPress={() => go(index - 1)}
        />
        <StepButton
          label={t(index === last ? 'capture.walk.again' : 'capture.walk.next')}
          primary
          onPress={() => go(index === last ? 0 : index + 1)}
        />
      </View>
    </View>
  );
}

/** One page: the drawn screen, playing while it is the one on show, over its words. */
function Page({
  step,
  size,
  active,
  still,
  number,
}: {
  readonly step: WalkthroughStep;
  readonly size: FrameSize;
  readonly active: boolean;
  readonly still: boolean;
  readonly number: number;
}) {
  const { palette } = useTheme();
  const t = useSharedValue(still ? step.still : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (still) {
      t.set(step.still);
      return;
    }
    // Off screen a page waits at its start, so it begins from there as it comes into view.
    t.set(0);
    if (active) {
      t.set(
        withRepeat(
          withTiming(1, {
            duration: step.loop,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          }),
          -1,
          false,
        ),
      );
    }
    return () => cancelAnimation(t);
  }, [active, still, step.loop, step.still, t]);

  return (
    <View style={{ width: size.width, paddingHorizontal: 14, gap: 14 }}>
      {/* Room for the longest words, so every page's screen sits at the same height. */}
      <View accessible style={{ gap: 5, paddingHorizontal: 6, minHeight: CAPTION_HEIGHT }}>
        <Text style={{ ...body(17, 650), lineHeight: 22, color: palette.ink }}>
          {`${number}. ${step.title}`}
        </Text>
        <Text style={{ ...body(15), lineHeight: 20.5, color: palette.inkSoft }}>{step.detail}</Text>
      </View>
      <View style={{ alignItems: 'center' }}>{step.frame(t, size)}</View>
    </View>
  );
}

/** The progress mark for one step: a dot that stretches into a bar while its step is on show. */
function Dot({
  index,
  position,
}: {
  readonly index: number;
  readonly position: SharedValue<number>;
}) {
  const { palette } = useTheme();
  const style = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(position.get() - index));
    return { width: 6 + 14 * near, opacity: 0.3 + 0.7 * near };
  });
  return (
    <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: palette.ink }, style]} />
  );
}

function StepButton({
  label,
  primary = false,
  disabled = false,
  onPress,
}: {
  readonly label: string;
  readonly primary?: boolean;
  readonly disabled?: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 99,
        backgroundColor: primary ? palette.btnBg : palette.chipBg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ ...body(16, 650), color: primary ? palette.btnFg : palette.ink }}>
        {label}
      </Text>
    </PressScale>
  );
}
