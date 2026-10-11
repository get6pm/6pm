import { Group, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { linearGradientLine } from '../../css-geometry';
import { parseFill, rgbaAt } from './surface-css';
import { sheenShift } from './surface-motion';

/** The sheen band is `left: -60%; width: 220%` of the screen, so it overshoots both sides. */
const LEFT = -0.6;
const SPAN = 2.2;

/**
 * Light rolling across the surface: a diagonal gradient band 2.2 screens wide that travels once
 * every 9 s (see `sheenShift`), screen-blended at `opacity`. Sơn Mài's band is gold with a white
 * core; Holo Foil's is a pastel rainbow.
 */
export function Sheen({
  css,
  opacity,
  width,
  height,
  time,
}: {
  readonly css: string;
  readonly opacity: SharedValue<number>;
  readonly width: number;
  readonly height: number;
  readonly time: SharedValue<number>;
}) {
  const fill = useMemo(() => parseFill(css), [css]);
  const shape = fill.shapes[0];
  const box = SPAN * width;
  const colors = useMemo(() => rgbaAt(fill.values, 0, shape?.positions.length ?? 0), [fill, shape]);
  const transform = useDerivedValue(() => [
    { translateX: LEFT * width + sheenShift(time.value, box) },
  ]);
  if (shape?.kind !== 'linear') return null;
  const { start, end } = linearGradientLine(shape.angleDeg, box, height);
  return (
    <Group transform={transform}>
      <Rect x={0} y={0} width={box} height={height} blendMode="screen" opacity={opacity}>
        <LinearGradient
          start={vec(start.x, start.y)}
          end={vec(end.x, end.y)}
          colors={colors}
          positions={shape.positions as number[]}
        />
      </Rect>
    </Group>
  );
}
