import type { ReactNode } from 'react';
import { Text, View, type TextStyle, type ViewProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { iosInk } from './frame-ink';
import { stage, touchOpacity, touchPoint, touchPress, type TouchStop } from './timeline';

const TOUCH = 46;

/**
 * The finger: a soft disc that glides between stops and presses at each tap. With Reduce Motion
 * the step holds a moment where it rests on the step's tap, so it still says where to touch.
 */
export function Touch({
  t,
  stops,
}: {
  readonly t: SharedValue<number>;
  readonly stops: readonly TouchStop[];
}) {
  const style = useAnimatedStyle(() => {
    const at = touchPoint(t.get(), stops);
    const press = touchPress(t.get(), stops);
    return {
      opacity: touchOpacity(t.get(), stops),
      transform: [
        { translateX: at.x - TOUCH / 2 },
        { translateY: at.y - TOUCH / 2 },
        { scale: 1 - 0.18 * press },
      ],
    };
  });
  const ring = useAnimatedStyle(() => {
    const press = touchPress(t.get(), stops);
    return { opacity: press * 0.9, transform: [{ scale: 1 + 0.5 * press }] };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, width: TOUCH, height: TOUCH }, style]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            inset: 0,
            borderRadius: TOUCH / 2,
            borderWidth: 2,
            borderColor: iosInk.touch,
          },
          ring,
        ]}
      />
      <View
        style={{
          flex: 1,
          borderRadius: TOUCH / 2,
          backgroundColor: iosInk.touch,
          borderWidth: 2.5,
          borderColor: iosInk.touchRim,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      />
    </Animated.View>
  );
}

/**
 * Something that appears between `from` and `to` (or, with `out`, goes away): it fades and may
 * travel in from `dx`/`dy` and grow from `fromScale`.
 */
export function Reveal({
  t,
  from,
  to,
  out = false,
  dx = 0,
  dy = 0,
  fromScale = 1,
  style,
  children,
}: {
  readonly t: SharedValue<number>;
  readonly from: number;
  readonly to: number;
  readonly out?: boolean;
  readonly dx?: number;
  readonly dy?: number;
  readonly fromScale?: number;
  readonly style?: ViewProps['style'];
  readonly children?: ReactNode;
}) {
  const animated = useAnimatedStyle(() => {
    const p = stage(t.get(), from, to);
    const shown = out ? 1 - p : p;
    const k = 1 - shown;
    return {
      opacity: shown,
      transform: [
        { translateX: dx * k },
        { translateY: dy * k },
        { scale: fromScale + (1 - fromScale) * shown },
      ],
    };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** Text typed in between `from` and `to`, with a caret that stays while it is being typed. */
export function Typed({
  t,
  from,
  to,
  text,
  width,
  style,
}: {
  readonly t: SharedValue<number>;
  readonly from: number;
  readonly to: number;
  readonly text: string;
  /** The text's full width; it is uncovered from the left. */
  readonly width: number;
  readonly style: TextStyle;
}) {
  const clip = useAnimatedStyle(() => ({ width: width * stage(t.get(), from, to) }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={[{ overflow: 'hidden' }, clip]}>
        <Text numberOfLines={1} style={[style, { width }]}>
          {text}
        </Text>
      </Animated.View>
      <View
        style={{ width: 2, height: (style.fontSize ?? 17) * 1.2, backgroundColor: iosInk.blue }}
      />
    </View>
  );
}

/** An iOS switch that turns `on` → off (or off → on) between `from` and `to`. */
export function Switch({
  t,
  from,
  to,
  startsOn,
}: {
  readonly t: SharedValue<number>;
  readonly from: number;
  readonly to: number;
  readonly startsOn: boolean;
}) {
  const track = useAnimatedStyle(() => {
    const p = stage(t.get(), from, to);
    const on = startsOn ? 1 - p : p;
    return { backgroundColor: interpolateColor(on, [0, 1], [iosInk.switchOff, iosInk.green]) };
  });
  const knob = useAnimatedStyle(() => {
    const p = stage(t.get(), from, to);
    const on = startsOn ? 1 - p : p;
    return { transform: [{ translateX: 2 + 20 * on }] };
  });
  return (
    <Animated.View style={[{ width: 51, height: 31, borderRadius: 16 }, track]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 2,
            width: 27,
            height: 27,
            borderRadius: 14,
            backgroundColor: iosInk.bg,
            boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
          },
          knob,
        ]}
      />
    </Animated.View>
  );
}

/** A row tint that flashes as the finger taps it at `at`. */
export function TapFlash({
  t,
  at,
  radius = 0,
}: {
  readonly t: SharedValue<number>;
  readonly at: number;
  readonly radius?: number;
}) {
  const style = useAnimatedStyle(() => {
    const on = stage(t.get(), at - 0.02, at) * (1 - stage(t.get(), at + 0.04, at + 0.1));
    return { opacity: on };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', inset: 0, borderRadius: radius, backgroundColor: iosInk.fill },
        style,
      ]}
    />
  );
}
