import { Blur, Group, Paint, Path } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useSceneTween } from '../use-scene-tween';
import {
  RAIN_LAYERS,
  RAIN_OVERHANG,
  RAIN_TILT_DEG,
  rainPath,
  type RainLayerSpec,
} from './rain-geometry';
import { asNumber, parseRainTile, type RainTile } from './weather-atm';
import { rainOffset } from './weather-math';

interface LayerProps {
  readonly tile: RainTile;
  readonly spec: RainLayerSpec;
  readonly width: number;
  readonly height: number;
  readonly time: SharedValue<number>;
}

function RainLayer({ tile, spec, width, height, time }: LayerProps) {
  const d = useMemo(() => rainPath(tile, spec, width, height), [tile, spec, width, height]);
  const [tw, th] = spec.tile;
  // The layer is the screen oversized and tilted about its centre; its tile slides down, looping.
  const place = useDerivedValue(() => [
    { translateX: width / 2 },
    { translateY: height / 2 },
    { rotate: (RAIN_TILT_DEG * Math.PI) / 180 },
    { translateX: -width / 2 - RAIN_OVERHANG.x * width },
    {
      translateY:
        -height / 2 - RAIN_OVERHANG.y * height + rainOffset(time.value, spec.periodMs, th),
    },
  ]);
  const scale = [{ scaleX: tw / tile.width }, { scaleY: th / tile.height }];
  const soften = (
    <Paint opacity={spec.opacity}>{spec.blur > 0 ? <Blur blur={spec.blur} /> : null}</Paint>
  );
  return (
    <Group transform={place} layer={spec.opacity < 1 || spec.blur > 0 ? soften : false}>
      <Group transform={scale}>
        <Path
          path={d}
          style="stroke"
          strokeWidth={tile.strokeWidth}
          strokeCap="round"
          color={[...tile.color]}
        />
      </Group>
    </Group>
  );
}

interface RainProps {
  readonly atm: Readonly<Record<string, unknown>>;
  readonly width: number;
  readonly height: number;
  readonly time: SharedValue<number>;
}

/**
 * Rain: two tilted layers of the look's stroke tile (a sharp, fast one and a larger, softer, slower
 * one) falling past, shown at the hour's rain strength.
 */
export function SceneRain({ atm, width, height, time }: RainProps) {
  const tile = useMemo(() => parseRainTile(atm.rainTile), [atm.rainTile]);
  const strength = useSceneTween([asNumber(atm.rainOp)]);
  const opacity = useDerivedValue(() => strength.value[0] ?? 0);
  if (!tile) return null;
  return (
    <Group opacity={opacity}>
      {RAIN_LAYERS.map((spec) => (
        <RainLayer
          key={spec.periodMs}
          tile={tile}
          spec={spec}
          width={width}
          height={height}
          time={time}
        />
      ))}
    </Group>
  );
}
