import { LinearGradient, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { linearGradientLine, radialGradientShape } from '../../css-geometry';
import type { SceneProps } from '../scene-props';
import { useSceneTween } from '../use-scene-tween';
import { parseFill, rgbaAt, shapeKey, surfaceOwnsSky, type FillShape } from './surface-css';

function Layer({
  shape,
  at,
  v,
  width,
  height,
}: {
  shape: FillShape;
  at: number;
  v: SharedValue<number[]>;
  width: number;
  height: number;
}) {
  const count = shape.positions.length;
  const colors = useDerivedValue(() => rgbaAt(v.value, at, count));
  const positions = shape.positions as number[];
  if (shape.kind === 'linear') {
    const { start, end } = linearGradientLine(shape.angleDeg, width, height);
    return (
      <Rect x={0} y={0} width={width} height={height} dither>
        <LinearGradient
          start={vec(start.x, start.y)}
          end={vec(end.x, end.y)}
          colors={colors}
          positions={positions}
        />
      </Rect>
    );
  }
  const { c, rx, ry } = radialGradientShape(shape.value, width, height);
  return (
    <Rect x={0} y={0} width={width} height={height} dither>
      <RadialGradient
        c={vec(c.x, c.y)}
        r={rx}
        colors={colors}
        positions={positions}
        origin={vec(c.x, c.y)}
        transform={[{ scaleY: rx > 0 ? ry / rx : 1 }]}
      />
    </Rect>
  );
}

function SkyBody({
  shapes,
  values,
  width,
  height,
}: {
  shapes: readonly FillShape[];
  values: readonly number[];
  width: number;
  height: number;
}) {
  const v = useSceneTween(values);
  let at = 0;
  return (
    <>
      {shapes.map((shape, i) => {
        const layerAt = at;
        at += 4 * shape.positions.length;
        return <Layer key={i} shape={shape} at={layerAt} v={v} width={width} height={height} />;
      })}
    </>
  );
}

/**
 * The sky of Riso Club (three flat bands of paper tone), Arcade (eight flat bands) and Sơn Mài (a
 * lacquer glow rising from the bottom over the gradient), read from the palette's own `sky`. The
 * shared `SkyGradient` knows only three smooth stops, so it draws these skies wrongly (Riso: not at
 * all). This is opaque and covers it; skip `SkyGradient` for these looks (`surfaceOwnsSky`) and
 * mount this in its place.
 */
export function SurfaceSky({ look, palette, width, height }: SceneProps) {
  const fill = useMemo(() => parseFill(palette.sky), [palette.sky]);
  if (!surfaceOwnsSky(look) || fill.shapes.length === 0) return null;
  return (
    <SkyBody
      key={shapeKey(fill.shapes)}
      shapes={fill.shapes}
      values={fill.values}
      width={width}
      height={height}
    />
  );
}
