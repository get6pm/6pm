import {
  Circle,
  Group,
  BlurMask,
  Rect,
  Shader,
  Skia,
  rect,
  rrect,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { SPIN_MS, TRAIL_RADIUS, type ExpoModel } from './expo-model';

/**
 * Three star trails, each a 1700 pt disc of one-point rings (`repeating-radial-gradient`, hard
 * stops) seen through a conic mask that leaves two arcs open, the disc spinning about the pole
 * star once every 160 s. All three composite in one pass: ring coverage by distance from the pole,
 * mask by angle from the top, clockwise, minus the spin.
 */
const TRAILS = Skia.RuntimeEffect.Make(`
uniform float2 pole;
uniform float spin;
uniform float radius;
uniform float3 period;
uniform float3 start;
uniform float3 span;
uniform float4 ink0;
uniform float4 ink1;
uniform float4 ink2;

float ramp(float x, float len) {
  if (x < 0.0) return 0.0;
  if (x < len) return x / len;
  if (x < len + 0.5) return 1.0 - (x - len) / 0.5;
  return 0.0;
}

half4 trail(float d, float deg, float per, float origin, float len, float4 ink) {
  float a = mod(deg - origin, 360.0);
  float arcs = max(ramp(a, len), ramp(a - 180.0, 0.7 * len));
  float band = step(per - 1.0, mod(d, per));
  float alpha = ink.a * arcs * band;
  return half4(half3(ink.rgb * alpha), half(alpha));
}

half4 main(float2 p) {
  float2 q = p - pole;
  float d = length(q);
  if (d > radius) return half4(0.0);
  float deg = degrees(atan(q.x, -q.y)) - spin;
  half4 a = trail(d, deg, period.x, start.x, span.x, ink0);
  half4 b = trail(d, deg, period.y, start.y, span.y, ink1);
  half4 c = trail(d, deg, period.z, start.z, span.z, ink2);
  return c + (1.0 - c.a) * (b + (1.0 - b.a) * a);
}
`);

interface Props {
  readonly model: ExpoModel;
  readonly time: SharedValue<number>;
  readonly width: number;
  readonly height: number;
}

/** The star trails and the pole star they turn about. */
export function ExpoTrails({ model, time, width, height }: Props) {
  const { trails, pole, starsOpacity } = model;
  const px = pole.x * width;
  const [t0, t1, t2] = trails;
  const uniforms = useDerivedValue(() => ({
    pole: [px, pole.y],
    spin: (360 * (time.value % SPIN_MS)) / SPIN_MS,
    radius: TRAIL_RADIUS,
    period: [t0?.period ?? 1, t1?.period ?? 1, t2?.period ?? 1],
    start: [t0?.fromDeg ?? 0, t1?.fromDeg ?? 0, t2?.fromDeg ?? 0],
    span: [t0?.spanDeg ?? 0, t1?.spanDeg ?? 0, t2?.spanDeg ?? 0],
    ink0: t0?.ink ?? [0, 0, 0, 0],
    ink1: t1?.ink ?? [0, 0, 0, 0],
    ink2: t2?.ink ?? [0, 0, 0, 0],
  }));
  if (!TRAILS || trails.length !== 3) return null;
  // `box-shadow: 0 0 6px 2px` on a 3 pt disc: a blurred 3.5 pt-radius disc outside the star.
  const star = rrect(rect(px - 1.5, pole.y - 1.5, 3, 3), 1.5, 1.5);
  return (
    <>
      <Rect x={0} y={0} width={width} height={height} opacity={starsOpacity}>
        <Shader source={TRAILS} uniforms={uniforms} />
      </Rect>
      <Group clip={star} invertClip opacity={starsOpacity}>
        <Circle cx={px} cy={pole.y} r={3.5} color="rgba(255,255,255,0.6)">
          <BlurMask blur={3} style="normal" respectCTM />
        </Circle>
      </Group>
      <Circle cx={px} cy={pole.y} r={1.5} color="#ffffff" opacity={starsOpacity} />
    </>
  );
}
