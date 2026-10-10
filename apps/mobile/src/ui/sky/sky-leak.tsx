import { Blend, LinearGradient, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { linearGradientLine, radialGradientShape } from './css-geometry';
import type { LeakShape } from './sky-frame';
import type { SkyLayerProps } from './sky-layer-props';
import { alternating } from './css-keyframes';
import { colorsAt, LEAK_STOPS, SLOT } from './sky-slots';

interface LeakGradientProps {
  readonly shape: LeakShape;
  readonly index: number;
  readonly frame: SharedValue<number[]>;
  readonly width: number;
  readonly height: number;
}

function LeakGradient({ shape, index, frame, width, height }: LeakGradientProps) {
  const at = SLOT.leak + 4 * LEAK_STOPS * index;
  const colors = useDerivedValue(() => colorsAt(frame.value, at, LEAK_STOPS));
  const positions = shape.at as number[];
  if (shape.kind === 'linear') {
    const { start, end } = linearGradientLine(shape.angleDeg, width, height);
    return (
      <LinearGradient
        start={vec(start.x, start.y)}
        end={vec(end.x, end.y)}
        colors={colors}
        positions={positions}
      />
    );
  }
  const { c, rx, ry } = radialGradientShape(shape.value, width, height);
  return (
    <RadialGradient
      c={vec(c.x, c.y)}
      r={rx}
      colors={colors}
      positions={positions}
      origin={vec(c.x, c.y)}
      transform={[{ scaleY: rx > 0 ? ry / rx : 1 }]}
    />
  );
}

/**
 * Golden Hour's light leak: a warm corner glow over a sideways wash, composited together and
 * screened over the sky, its strength breathing between 45% and 100% over 9 s.
 */
export function SkyLeak({ frame, layout, width, height, time }: SkyLayerProps) {
  const opacity = useDerivedValue(
    () => (frame.value[SLOT.leakOp] ?? 0) * (0.45 + 0.55 * alternating(time.value, 9_000)),
  );
  if (layout.leaks.length === 0) return null;
  return (
    <Rect x={0} y={0} width={width} height={height} blendMode="screen" opacity={opacity} dither>
      <Blend mode="srcOver">
        {layout.leaks.map((shape, i) => (
          <LeakGradient
            key={i}
            shape={shape}
            index={i}
            frame={frame}
            width={width}
            height={height}
          />
        ))}
      </Blend>
    </Rect>
  );
}
