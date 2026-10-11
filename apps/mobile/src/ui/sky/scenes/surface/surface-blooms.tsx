import { Blend, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { radialGradientShape } from '../../css-geometry';
import { drift1, drift2, driftAt, type Drift } from '../../css-keyframes';
import type { SceneProps } from '../scene-props';
import { useSceneTween } from '../use-scene-tween';
import {
  blendOf,
  numberOf,
  parseFill,
  rgbaAt,
  shapeKey,
  surfaceOwnsBlooms,
  textOf,
  type FillShape,
} from './surface-css';

interface Spec {
  /** Left edge in points for a sky `w` wide. */
  readonly left: (w: number) => number;
  readonly top: number;
  readonly size: number;
  readonly ink: 'A' | 'B';
  readonly opacity: number;
  readonly drift: Drift;
}

/** The three blooms of the prototype's sky: same boxes and drifts as the soft blooms. */
const BLOOMS: readonly Spec[] = [
  { left: (w) => -0.3 * w, top: 300, size: 440, ink: 'A', opacity: 1, drift: drift1(19_000) },
  { left: (w) => 1.35 * w - 400, top: -60, size: 400, ink: 'B', opacity: 1, drift: drift2(23_000) },
  {
    left: (w) => 0.3 * w,
    top: 560,
    size: 300,
    ink: 'B',
    opacity: 0.6,
    drift: drift1(27_000, true),
  },
];

function Bloom({
  spec,
  shape,
  count,
  v,
  time,
  width,
}: {
  spec: Spec;
  shape: Extract<FillShape, { kind: 'radial' }>;
  count: number;
  v: SharedValue<number[]>;
  time: SharedValue<number>;
  width: number;
}) {
  const cx = spec.left(width) + spec.size / 2;
  const cy = spec.top + spec.size / 2;
  // `radial-gradient(circle, ink 0 60%, transparent 60.5%)` reaches its end at the box's corner.
  const radius = radialGradientShape(shape.value, spec.size, spec.size).rx;
  const at = 1 + (spec.ink === 'A' ? 0 : 4 * count);
  const { opacity, drift } = spec;
  const colors = useDerivedValue(() => rgbaAt(v.value, at, count, opacity));
  const transform = useDerivedValue(() => driftAt(drift, time.value, cx, cy));
  return (
    <RadialGradient
      c={vec(cx, cy)}
      r={radius}
      colors={colors}
      positions={shape.positions as number[]}
      transform={transform}
    />
  );
}

function BloomsBody({
  shapes,
  values,
  blend,
  width,
  height,
  time,
}: {
  shapes: readonly [Extract<FillShape, { kind: 'radial' }>, Extract<FillShape, { kind: 'radial' }>];
  values: readonly number[];
  blend: ReturnType<typeof blendOf>;
  width: number;
  height: number;
  time: SharedValue<number>;
}) {
  const v = useSceneTween(values);
  const opacity = useDerivedValue(() => v.value[0] ?? 0);
  const count = shapes[0].positions.length;
  return (
    <Rect x={0} y={0} width={width} height={height} blendMode={blend} opacity={opacity} dither>
      <Blend mode="srcOver">
        {BLOOMS.map((spec) => (
          <Bloom
            key={spec.size}
            spec={spec}
            shape={spec.ink === 'A' ? shapes[0] : shapes[1]}
            count={count}
            v={v}
            time={time}
            width={width}
          />
        ))}
      </Blend>
    </Rect>
  );
}

/**
 * Riso Club's blooms: flat discs of the two inks with a hard edge (no blur), drifting as the soft
 * blooms do, multiplied onto the sky at the look's bloom opacity. The shared `SkyBlooms` reads
 * only single-position stops and draws nothing for these, so hide it for these looks
 * (`surfaceOwnsBlooms`) and mount this at the same depth, right after the sky.
 */
export function SurfaceBlooms({ look, atm, width, height, time }: SceneProps) {
  const a = useMemo(() => parseFill(textOf(atm, 'bloomA')), [atm]);
  const b = useMemo(() => parseFill(textOf(atm, 'bloomB')), [atm]);
  const shapeA = a.shapes[0];
  const shapeB = b.shapes[0];
  if (
    !surfaceOwnsBlooms(look) ||
    shapeA?.kind !== 'radial' ||
    shapeB?.kind !== 'radial' ||
    shapeA.positions.length !== shapeB.positions.length
  ) {
    return null;
  }
  return (
    <BloomsBody
      key={shapeKey([shapeA, shapeB])}
      shapes={[shapeA, shapeB]}
      values={[numberOf(atm, 'bloomOp'), ...a.values, ...b.values]}
      blend={blendOf(textOf(atm, 'blend'))}
      width={width}
      height={height}
      time={time}
    />
  );
}
