import { RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { radialGradientShape } from '../../css-geometry';
import { parseGradients, resolveStops, type RadialGradientValue } from '../../css-values';
import { useSceneTween } from '../use-scene-tween';
import type { SceneProps } from '../scene-props';

/** The glow a look paints into its sky gradient, if its `sky` carries a radial layer. */
function skyGlow(sky: string): RadialGradientValue | null {
  return parseGradients(sky).find((g): g is RadialGradientValue => g.kind === 'radial') ?? null;
}

/**
 * Long Exposure's sky carries a warm band across the horizon on top of its three-colour gradient
 * (`radial-gradient(90% 22% at 50% 48%, …)`). Draw it straight after the sky gradient, under the
 * blooms; it returns null for every other look.
 */
export function LivingBackdrop({ look, palette, width, height }: SceneProps) {
  const glow = useMemo(() => (look === 'expo' ? skyGlow(palette.sky) : null), [look, palette.sky]);
  const stops = useMemo(() => (glow ? resolveStops(glow.stops) : null), [glow]);
  const start = stops?.colors[0] ?? [0, 0, 0, 0];
  const end = stops?.colors[stops.colors.length - 1] ?? [0, 0, 0, 0];
  const tween = useSceneTween([...start, ...end]);
  const colors = useDerivedValue(() => [
    [tween.value[0] ?? 0, tween.value[1] ?? 0, tween.value[2] ?? 0, tween.value[3] ?? 0],
    [tween.value[4] ?? 0, tween.value[5] ?? 0, tween.value[6] ?? 0, tween.value[7] ?? 0],
  ]);
  if (!glow || !stops || stops.colors.length !== 2) return null;
  const { c, rx, ry } = radialGradientShape(glow, width, height);
  return (
    <Rect x={0} y={0} width={width} height={height} dither>
      <RadialGradient
        c={vec(c.x, c.y)}
        r={rx}
        colors={colors}
        positions={stops.positions as number[]}
        origin={vec(c.x, c.y)}
        transform={[{ scaleY: rx > 0 ? ry / rx : 1 }]}
      />
    </Rect>
  );
}
