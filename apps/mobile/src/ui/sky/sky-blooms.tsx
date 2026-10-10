import { Blend, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import type { RadialProfile } from './blur-profile';
import type { SkyLayerProps } from './sky-layer-props';
import { drift1, drift2, driftAt, type Drift } from './css-keyframes';
import { SLOT } from './sky-slots';

interface BloomSpec {
  /** Left edge in points for a sky `w` wide. */
  readonly left: (w: number) => number;
  readonly top: number;
  readonly size: number;
  readonly color: 'bloomA' | 'bloomB';
  readonly opacity: number;
  readonly drift: Drift;
}

/** The three soft blooms of the prototype's sky (`left`, `top`, size, colour, drift). */
const BLOOMS: readonly [BloomSpec, BloomSpec, BloomSpec] = [
  {
    left: (w) => -0.3 * w,
    top: 300,
    size: 440,
    color: 'bloomA',
    opacity: 1,
    drift: drift1(19_000),
  },
  {
    left: (w) => 1.35 * w - 400,
    top: -60,
    size: 400,
    color: 'bloomB',
    opacity: 1,
    drift: drift2(23_000),
  },
  {
    left: (w) => 0.3 * w,
    top: 560,
    size: 300,
    color: 'bloomB',
    opacity: 0.6,
    drift: drift1(27_000, true),
  },
];

function BloomShader({
  spec,
  profile,
  frame,
  time,
  width,
}: {
  readonly spec: BloomSpec;
  readonly profile: RadialProfile;
  readonly frame: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  readonly width: number;
}) {
  const cx = spec.left(width) + spec.size / 2;
  const cy = spec.top + spec.size / 2;
  const { alphas } = profile;
  const at = SLOT[spec.color];
  const { opacity, drift } = spec;
  const colors = useDerivedValue(() => {
    const v = frame.value;
    const r = v[at] ?? 0;
    const g = v[at + 1] ?? 0;
    const b = v[at + 2] ?? 0;
    const a = (v[at + 3] ?? 0) * opacity;
    return alphas.map((k) => [r, g, b, a * k]);
  });
  const transform = useDerivedValue(() => driftAt(drift, time.value, cx, cy));
  return (
    <RadialGradient
      c={vec(cx, cy)}
      r={profile.radius}
      colors={colors}
      positions={profile.positions as number[]}
      transform={transform}
    />
  );
}

/**
 * Three drifting blooms of the hour's bloom colours, composited together and then blended onto the
 * sky (screen after dark, multiply by day) at the look's bloom opacity, like the prototype's bloom
 * container. Each blur is baked into its gradient, so this is one full-screen gradient pass.
 */
export function SkyBlooms({ frame, layout, width, height, time }: SkyLayerProps) {
  const opacity = useDerivedValue(() => frame.value[SLOT.bloomOp] ?? 0);
  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      blendMode={layout.bloomBlend}
      opacity={opacity}
      dither
    >
      <Blend mode="srcOver">
        {BLOOMS.map((spec, i) => (
          <BloomShader
            key={spec.size}
            spec={spec}
            profile={layout.blooms[i] ?? layout.blooms[0]}
            frame={frame}
            time={time}
            width={width}
          />
        ))}
      </Blend>
    </Rect>
  );
}
