import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { parseColor } from '../../ui/sky/css-values';
import { skyRgbaAt, stepProgress, SUN } from './onboarding-palette';

/** The sky eases between steps over 1.2 s (CSS `ease`); the sun glides on its own curve. */
const SKY_EASE = { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };
const SUN_EASE = { duration: 1200, easing: Easing.bezier(0.3, 0.8, 0.3, 1) };
const REDUCED = { duration: 200 };
/** The design's sun is placed from the top of a 874 pt screen whose safe area starts at 62. */
const DESIGN_TOP = 62;

const rgba = (c: string) => [...(parseColor(c) ?? [0, 0, 0, 0])];
const COOL = { core: rgba(SUN.cool.core), rim: rgba(SUN.cool.rim), glow: rgba(SUN.cool.glow) };
const WARM = { core: rgba(SUN.warm.core), rim: rgba(SUN.warm.rim), glow: rgba(SUN.warm.glow) };

function mix(a: readonly number[], b: readonly number[], u: number): number[] {
  'worklet';
  return a.map((v, i) => v + ((b[i] ?? v) - v) * u);
}

/** Where the sun sits on a step: [x fraction, y, diameter, opacity, warmth]. */
function sunTarget(step: number): number[] {
  const t = stepProgress(step);
  return [
    0.18 + t * 0.64,
    step === 7 ? 700 : 150 + t * t * 470,
    80 + t * 70,
    step === 0 ? 0 : 1,
    t > 0.6 ? 1 : 0,
  ];
}

/**
 * The onboarding sky: a three-stop gradient that runs from morning to dusk as the steps go by,
 * and a sun that crosses and sinks with it, warming past the middle. Both tween on the UI thread;
 * with Reduce Motion they cross-fade quickly instead.
 */
export function OnboardingSky({
  step,
  safeTop,
}: {
  readonly step: number;
  readonly safeTop: number;
}) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(stepProgress(step));
  const sun = useSharedValue(sunTarget(step));

  useEffect(() => {
    t.value = withTiming(stepProgress(step), reduceMotion ? REDUCED : SKY_EASE);
    sun.value = withTiming(sunTarget(step), reduceMotion ? REDUCED : SUN_EASE);
  }, [step, t, sun, reduceMotion]);

  const colors = useDerivedValue(() => skyRgbaAt(t.value));
  const cx = useDerivedValue(() => (sun.value[0] ?? 0) * width);
  const cy = useDerivedValue(() => (sun.value[1] ?? 0) + safeTop - DESIGN_TOP);
  const r = useDerivedValue(() => (sun.value[2] ?? 0) / 2);
  const opacity = useDerivedValue(() => sun.value[3] ?? 0);
  const warm = () => {
    'worklet';
    return sun.value[4] ?? 0;
  };
  // `box-shadow: 0 0 <blur> <spread>`: a disc grown by the spread, blurred by half the blur.
  const glowR = useDerivedValue(
    () => r.value + SUN.cool.spread + (SUN.warm.spread - SUN.cool.spread) * warm(),
  );
  const glowBlur = useDerivedValue(
    () => (SUN.cool.blur + (SUN.warm.blur - SUN.cool.blur) * warm()) / 2,
  );
  const glowColor = useDerivedValue(() => mix(COOL.glow, WARM.glow, warm()));
  // `radial-gradient(circle at 50% 40%, core, rim 70%)`, sized to the farthest corner.
  const focus = useDerivedValue(() => vec(cx.value, cy.value - r.value * 0.2));
  const focusR = useDerivedValue(() => 2 * r.value * Math.hypot(0.5, 0.6));
  const stops = useDerivedValue(() => {
    const rim = mix(COOL.rim, WARM.rim, warm());
    return [mix(COOL.core, WARM.core, warm()), rim, rim];
  });

  return (
    <Canvas style={[StyleSheet.absoluteFill, styles.passThrough]}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={colors}
          positions={[0, 0.55, 1]}
        />
      </Rect>
      <Group opacity={opacity}>
        <Circle cx={cx} cy={cy} r={glowR} color={glowColor}>
          <BlurMask blur={glowBlur} style="normal" respectCTM />
        </Circle>
        <Circle cx={cx} cy={cy} r={r}>
          <RadialGradient c={focus} r={focusR} colors={stops} positions={[0, 0.7, 1]} />
        </Circle>
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({ passThrough: { pointerEvents: 'none' } });
