import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { easeOut } from '../motion/curves';
import { useTheme } from '../theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Sinking under the finger: quick enough to answer the touch, never still moving on a fast tap. */
const PRESS_IN_MS = 100;
const RELEASE_MS = 150;
/**
 * Inside a scroll view a touch is a scroll until proven otherwise: waiting this long before
 * answering means starting a scroll on a card never flashes it pressed.
 */
const SCROLL_PRESS_DELAY_MS = 80;
const reduceMotion = ReduceMotion.System;

export interface PressScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  /** How far the control sinks while held: .95 for buttons, .97 for wide CTAs (the prototype's `:active`). Rows that highlight default to 1. */
  readonly scaleTo?: number;
  /** A list row: a tint washes over it while held and fades as it lets go, as iOS rows do. */
  readonly highlight?: boolean;
  /** How far the highlight reaches past the row's sides, for rows inset from their card's edge. */
  readonly highlightBleed?: number;
  /** Hosted by a scroll view, so a press waits a moment to be sure it is not a scroll. Rows that highlight are. */
  readonly inScroll?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly children: ReactNode;
}

/** A pressable that sinks (or, for a row, lights) under the finger on the UI thread. */
export function PressScale({
  scaleTo,
  highlight = false,
  highlightBleed = 0,
  inScroll = highlight,
  style,
  children,
  ...rest
}: PressScaleProps) {
  const sink = scaleTo ?? (highlight ? 1 : 0.95);
  const pressed = useSharedValue(0);
  const lit = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - sink) * pressed.get() }],
  }));
  return (
    <AnimatedPressable
      {...(inScroll ? { unstable_pressDelay: SCROLL_PRESS_DELAY_MS } : {})}
      {...rest}
      onPressIn={(e) => {
        if (sink !== 1) {
          pressed.set(withTiming(1, { duration: PRESS_IN_MS, easing: easeOut, reduceMotion }));
        }
        // A row lights at once, the way a table cell does.
        if (highlight) lit.set(1);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (sink !== 1) {
          pressed.set(withTiming(0, { duration: RELEASE_MS, easing: easeOut, reduceMotion }));
        }
        if (highlight) {
          lit.set(withTiming(0, { duration: RELEASE_MS, easing: easeOut, reduceMotion }));
        }
        rest.onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {highlight ? <RowTint lit={lit} bleed={highlightBleed} /> : null}
      {children}
    </AnimatedPressable>
  );
}

/** The row's held tint; only rows read the theme, so a plain button works before the theme loads. */
function RowTint({ lit, bleed }: { readonly lit: SharedValue<number>; readonly bleed: number }) {
  const { palette } = useTheme();
  const tint = useAnimatedStyle(() => ({ opacity: lit.get() }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: -bleed,
          right: -bleed,
          backgroundColor: palette.hair,
        },
        tint,
      ]}
    />
  );
}
