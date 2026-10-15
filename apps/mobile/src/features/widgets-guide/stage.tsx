import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { screenOpacity } from '../capture-guide/walkthrough/timeline';

/** The drawn iPhone's width in iOS points (an iPhone 17 Pro): every stage is drawn at it. */
export const SCREEN_WIDTH = 402;

/**
 * The colours of iOS around the widgets: a wallpaper, Control Center's glass and its controls.
 * They are the system's, not 6pm's look, so the drawing reads as the phone the person holds.
 */
export const stageInk = {
  wallpaper: 'linear-gradient(165deg, #23305E 0%, #5A4C8C 52%, #D08C8A 100%)',
  /** An app icon on the Home Screen, as a soft placeholder: the guide names no other app. */
  appIcon: 'rgba(255,255,255,0.28)',
  appLabel: 'rgba(255,255,255,0.45)',
  /** Control Center's dimmed, blurred page and the glass of a control. */
  ccDim: 'rgba(8,10,24,0.55)',
  ccGlass: 'rgba(255,255,255,0.16)',
  ccGlassStrong: 'rgba(255,255,255,0.26)',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
  black: '#000000',
  /** The phone's titanium edge and its side buttons. */
  frame: '#3A3A3C',
  frameLight: '#8E8E93',
} as const;

/**
 * A loop clock for a stage: 0 → 1 over `loop` ms, again and again. With Reduce Motion nothing
 * loops: the stage holds at `still`, its settled picture.
 */
export function useLoop(loop: number, still: number): SharedValue<number> {
  const reduce = useReducedMotion();
  const t = useSharedValue(reduce ? still : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (reduce) {
      t.set(still);
      return;
    }
    t.set(0);
    t.set(
      withRepeat(
        withTiming(1, { duration: loop, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(t);
  }, [loop, still, reduce, t]);
  return t;
}

/**
 * A piece of the phone drawn at its real size in points and shrunk to `width`, on the wallpaper.
 * Its drawing fades out and in again as the loop restarts, so the wrap never shows.
 */
export function Stage({
  t,
  width,
  height,
  background = stageInk.wallpaper,
  radius = 24,
  children,
}: {
  readonly t: SharedValue<number>;
  /** On-screen width; the drawing inside is `SCREEN_WIDTH` points wide. */
  readonly width: number;
  /** The drawing's height in iOS points. */
  readonly height: number;
  readonly background?: string;
  readonly radius?: number;
  readonly children: ReactNode;
}) {
  const scale = width / SCREEN_WIDTH;
  const fade = useAnimatedStyle(() => ({ opacity: screenOpacity(t.get()) }));
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width,
        height: height * scale,
        borderRadius: radius,
        overflow: 'hidden',
        experimental_backgroundImage: background,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: SCREEN_WIDTH,
            height,
            transformOrigin: 'top left',
            transform: [{ scale }],
          },
          fade,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/** A ghost app icon with its name line under it, as the Home Screen grid draws one. */
export function AppGhost({ size = 64 }: { readonly size?: number }) {
  return (
    <View style={{ width: size, alignItems: 'center', gap: 7 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.27,
          backgroundColor: stageInk.appIcon,
        }}
      />
      <View
        style={{
          width: size * 0.62,
          height: 7,
          borderRadius: 4,
          backgroundColor: stageInk.appLabel,
        }}
      />
    </View>
  );
}
