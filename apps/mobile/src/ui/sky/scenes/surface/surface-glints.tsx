import {
  BlurMask,
  Group,
  LinearGradient,
  RoundedRect,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { linearGradientLine } from '../../css-geometry';
import type { SceneProps } from '../scene-props';
import { useSceneTween } from '../use-scene-tween';
import { parseGlints, type GlintShape } from './surface-glint-spec';
import { rgbaOne, shapeKey } from './surface-css';
import { twinkle } from './surface-motion';

/** The glints rise with the list's scroll at 0.15x. */
const PARALLAX = 0.15;

function Glint({
  shape,
  glow,
  strength,
  time,
  width,
}: {
  shape: GlintShape;
  glow: SharedValue<number[]>;
  strength: SharedValue<number>;
  time: SharedValue<number>;
  width: number;
}) {
  const { w, h, radius, rotation, periodMs, delayMs, fill, shadows, glowAt } = shape;
  const cx = shape.left * width + w / 2;
  const cy = shape.top + h / 2;
  const box = rect(-w / 2, -h / 2, w, h);
  const round = rrect(box, radius, radius);
  // `@keyframes twinkle`: opacity .35 -> 1 and scale .85 -> 1.1 on the flake itself, inside the
  // rotation that places it.
  const phase = useDerivedValue(() => twinkle(time.value, delayMs, periodMs));
  const transform = useDerivedValue(() => [
    { translateX: cx },
    { translateY: cy },
    { rotate: rotation },
    { scale: 0.85 + 0.25 * phase.value },
  ]);
  const opacity = useDerivedValue(() => strength.value * (0.35 + 0.65 * phase.value));
  const line = linearGradientLine(fill.angleDeg, w, h);
  const colors = fill.colors as number[][];
  const flat = colors[0] ?? [0, 0, 0, 0];
  // Box shadows paint the first one on top: draw the last one first.
  const order = shadows.map((_, i) => shadows.length - 1 - i);
  return (
    <Group transform={transform} opacity={opacity}>
      <Group clip={round} invertClip>
        {order.map((i) => (
          <GlintGlow key={i} shape={shape} shadow={shadows[i]} at={glowAt + 4 * i} glow={glow} />
        ))}
      </Group>
      {colors.length > 1 ? (
        <RoundedRect x={-w / 2} y={-h / 2} width={w} height={h} r={radius}>
          <LinearGradient
            start={vec(line.start.x - w / 2, line.start.y - h / 2)}
            end={vec(line.end.x - w / 2, line.end.y - h / 2)}
            colors={colors}
            positions={fill.positions as number[]}
          />
        </RoundedRect>
      ) : (
        <RoundedRect x={-w / 2} y={-h / 2} width={w} height={h} r={radius} color={flat} />
      )}
    </Group>
  );
}

/** One glow: the flake grown by `spread` and blurred by σ = blur / 2, clipped outside the flake. */
function GlintGlow({
  shape,
  shadow,
  at,
  glow,
}: {
  shape: GlintShape;
  shadow: GlintShape['shadows'][number] | undefined;
  at: number;
  glow: SharedValue<number[]>;
}) {
  const { blur = 0, spread = 0 } = shadow ?? {};
  const { w, h, radius } = shape;
  const color = useDerivedValue(() => rgbaOne(glow.value, at));
  return (
    <RoundedRect
      x={-w / 2 - spread}
      y={-h / 2 - spread}
      width={w + 2 * spread}
      height={h + 2 * spread}
      r={radius + spread}
      color={color}
    >
      {blur > 0 && <BlurMask blur={blur / 2} style="normal" respectCTM />}
    </RoundedRect>
  );
}

function GlintsBody({
  shapes,
  values,
  width,
  time,
  scrollY,
}: {
  shapes: readonly GlintShape[];
  values: readonly number[];
  width: number;
  time: SharedValue<number>;
  scrollY: SharedValue<number>;
}) {
  // values: the glints' strength, then every glow colour.
  const tween = useSceneTween(values);
  const strength = useDerivedValue(() => tween.value[0] ?? 0);
  const glow = useDerivedValue(() => tween.value.slice(1));
  const lift = useDerivedValue(() => [{ translateY: -PARALLAX * scrollY.value }]);
  return (
    <Group transform={lift}>
      {shapes.map((shape, i) => (
        <Glint key={i} shape={shape} glow={glow} strength={strength} time={time} width={width} />
      ))}
    </Group>
  );
}

/**
 * Gold-leaf flakes (Sơn Mài) or white sparkles (Holo Foil): small rotated shapes with a glow that
 * twinkle on their own periods, normal-blended, rising at 0.15x the scroll. Nothing when the look's
 * "Gold leaf" or "Sparkles" switch is off.
 */
export function Glints({
  glints,
  strength,
  width,
  time,
  scrollY,
}: Pick<SceneProps, 'width' | 'time' | 'scrollY'> & {
  readonly glints: unknown;
  readonly strength: number;
}) {
  const parsed = useMemo(() => parseGlints(glints), [glints]);
  if (parsed.shapes.length === 0) return null;
  return (
    <GlintsBody
      key={shapeKey(parsed.shapes)}
      shapes={parsed.shapes}
      values={[strength, ...parsed.glow]}
      width={width}
      time={time}
      scrollY={scrollY}
    />
  );
}
