import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  RadialGradient,
  rect,
  rrect,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { linearGradientLine } from '../../css-geometry';
import { SUN_PARALLAX } from '../../sky-sun';
import type { SceneProps } from '../scene-props';
import { useSceneTween } from '../use-scene-tween';
import { rgbaAt, rgbaOne, shapeKey } from './surface-css';
import {
  maskedStops,
  shadowOffset,
  sunFrame,
  SUN,
  type SunFill,
  type SunShape,
} from './surface-sun-spec';

export interface SurfaceSunProps extends SceneProps {
  /** The sun belongs to the Today tab only (same flag the shared sky takes). */
  readonly showSun?: boolean;
}

interface Place {
  readonly v: SharedValue<number[]>;
  readonly cx: SharedValue<number>;
  readonly cy: SharedValue<number>;
  readonly size: SharedValue<number>;
  readonly radius: SharedValue<number>;
  readonly opacity: SharedValue<number>;
}

type Filled = Exclude<SunFill, { kind: 'none' }>;

/** The disc's fill over its own box, with the stripe mask (if any) baked into the stops. */
function Disc({ fill, mask, place }: { fill: Filled; mask: SunShape['mask']; place: Place }) {
  const { v, cx, cy, size, radius, opacity } = place;
  const count = fill.positions.length;
  const stops = useDerivedValue(() => {
    const colors = rgbaAt(v.value, SUN.fill, count);
    return mask
      ? maskedStops(colors, fill.positions, size.value, mask)
      : { colors, positions: fill.positions as number[] };
  });
  const colors = useDerivedValue(() => stops.value.colors);
  const positions = useDerivedValue(() => stops.value.positions);
  const center = useDerivedValue(() => vec(cx.value, cy.value));
  const unit = useMemo(
    () => (fill.kind === 'linear' ? linearGradientLine(fill.angleDeg, 1, 1) : null),
    [fill],
  );
  const line = useDerivedValue(() => {
    const s = size.value;
    const left = cx.value - radius.value;
    const top = cy.value - radius.value;
    const u = unit ?? { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };
    return {
      start: vec(left + u.start.x * s, top + u.start.y * s),
      end: vec(left + u.end.x * s, top + u.end.y * s),
    };
  });
  // `radial-gradient(circle at X Y, …)` over the disc's box: farthest-corner radius.
  const focus = useDerivedValue(() => {
    const [ax, ay] = fill.kind === 'radial' ? fill.at : [0.5, 0.5];
    const s = size.value;
    return {
      c: vec(cx.value - radius.value + ax * s, cy.value - radius.value + ay * s),
      r: s * Math.hypot(Math.max(ax, 1 - ax), Math.max(ay, 1 - ay)),
    };
  });
  const start = useDerivedValue(() => line.value.start);
  const end = useDerivedValue(() => line.value.end);
  const focusC = useDerivedValue(() => focus.value.c);
  const focusR = useDerivedValue(() => focus.value.r);
  // CSS conic gradients start at 12 o'clock; Skia's sweep starts at 3 o'clock.
  const spin = fill.kind === 'conic' ? [{ rotate: ((fill.fromDeg - 90) * Math.PI) / 180 }] : [];

  return (
    <Circle cx={cx} cy={cy} r={radius} opacity={opacity}>
      {fill.kind === 'linear' && (
        <LinearGradient start={start} end={end} colors={colors} positions={positions} />
      )}
      {fill.kind === 'radial' && (
        <RadialGradient c={focusC} r={focusR} colors={colors} positions={positions} />
      )}
      {fill.kind === 'conic' && (
        <SweepGradient
          c={center}
          colors={colors}
          positions={positions}
          origin={center}
          transform={spin}
        />
      )}
    </Circle>
  );
}

/** One `box-shadow` outside the disc: the disc grown by `spread`, blurred by σ = blur / 2. */
function Shadow({ index, shape, place }: { index: number; shape: SunShape; place: Place }) {
  const { v, cx, cy, radius, opacity } = place;
  const { blur, spread } = shape.shadows[index] ?? { blur: 0, spread: 0 };
  const at = shadowOffset(shape) + 4 * index;
  const color = useDerivedValue(() => rgbaOne(v.value, at, opacity.value));
  const r = useDerivedValue(() => radius.value + spread);
  return (
    <Circle cx={cx} cy={cy} r={r} color={color}>
      {blur > 0 && <BlurMask blur={blur / 2} style="normal" respectCTM />}
    </Circle>
  );
}

/** Riso's second ink: the same disc, offset, multiplied onto the page. */
function Ghost({ dx, dy, place }: { dx: number; dy: number; place: Place }) {
  const { v, cx, cy, radius } = place;
  const x = useDerivedValue(() => cx.value + dx);
  const y = useDerivedValue(() => cy.value + dy);
  const color = useDerivedValue(() => rgbaOne(v.value, SUN.ghostColor, v.value[SUN.ghostOp] ?? 0));
  return <Circle cx={x} cy={y} r={radius} color={color} blendMode="multiply" />;
}

function SunBody({
  shape,
  values,
  width,
  scrollY,
}: {
  shape: SunShape;
  values: readonly number[];
  width: number;
  scrollY: SharedValue<number>;
}) {
  const v = useSceneTween(values);
  const lift = useDerivedValue(() => [{ translateY: -SUN_PARALLAX * scrollY.value }]);
  const cx = useDerivedValue(() => (v.value[SUN.x] ?? 0) * width);
  const cy = useDerivedValue(() => v.value[SUN.y] ?? 0);
  const size = useDerivedValue(() => v.value[SUN.size] ?? 0);
  const radius = useDerivedValue(() => size.value / 2);
  const opacity = useDerivedValue(() => v.value[SUN.opacity] ?? 0);
  const place: Place = { v, cx, cy, size, radius, opacity };
  const disc = useDerivedValue(() => {
    const r = radius.value;
    return rrect(rect(cx.value - r, cy.value - r, 2 * r, 2 * r), r, r);
  });
  const { fill, ghost } = shape;
  // Box shadows paint the first one on top: draw the last one first.
  const order = shape.shadows.map((_, i) => shape.shadows.length - 1 - i);

  return (
    <Group transform={lift}>
      {fill.kind !== 'none' && (
        <>
          <Group clip={disc} invertClip>
            {order.map((i) => (
              <Shadow key={i} index={i} shape={shape} place={place} />
            ))}
          </Group>
          <Disc fill={fill} mask={shape.mask} place={place} />
        </>
      )}
      {ghost && <Ghost dx={ghost.dx} dy={ghost.dy} place={place} />}
    </Group>
  );
}

/**
 * The sun parts the shared `SkySun` cannot draw, rising with the list's scroll at 0.35x on its own:
 * - Holo Foil, Sơn Mài, Arcade: the whole sun (disc, rings and halo). Do not also draw `SkySun`
 *   for these looks (`surfaceOwnsSun`); mount this right after the sun group, outside it.
 * - Riso: only the off-register ghost (multiplied), over the shared `SkySun`'s flat ink.
 * Returns null for every other look.
 */
export function SurfaceSun({ showSun = true, ...scene }: SurfaceSunProps) {
  const { look, config, hour, serious, palette, width, scrollY } = scene;
  const frame = useMemo(
    () => sunFrame({ look, config, hour, serious, showSun }, palette),
    [look, config, hour, serious, showSun, palette],
  );
  if (!frame) return null;
  return (
    <SunBody
      key={shapeKey(frame.shape)}
      shape={frame.shape}
      values={frame.values}
      width={width}
      scrollY={scrollY}
    />
  );
}
