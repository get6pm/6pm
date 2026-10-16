import { FilterMode, Group, ImageShader, MipmapMode, Rect } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { PixelRatio } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useSceneTween } from '../use-scene-tween';
import { bakeRainTile } from './rain-bake';
import {
  RAIN_OVERHANG,
  RAIN_TILT_DEG,
  rainCells,
  rainLayersFor,
  type RainLayerSpec,
} from './rain-geometry';
import { asNumber, parseRainTile, type RainTile } from './weather-atm';
import { rainOffset } from './weather-math';

/** The tilted tile is sampled smoothly, as the browser draws a rotated background. */
const LINEAR = { filter: FilterMode.Linear, mipmap: MipmapMode.None };

interface LayerProps {
  readonly tile: RainTile;
  readonly spec: RainLayerSpec;
  readonly width: number;
  readonly height: number;
  readonly time: SharedValue<number>;
  readonly strength: SharedValue<number>;
}

function RainLayer({ tile, spec, width, height, time, strength }: LayerProps) {
  // The tile is painted once, blur and all, and repeats as an image: a frame samples a texture
  // instead of stroking and blurring a screenful of lines on the CPU.
  const scale = PixelRatio.get();
  const baked = useMemo(() => bakeRainTile(tile, spec, scale), [tile, spec, scale]);
  const { c0, c1, r0, r1 } = useMemo(() => rainCells(spec, width, height), [spec, width, height]);
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
  // The layer's opacity and the hour's rain strength, over each stroke's own ink.
  const alpha = useDerivedValue(() => tile.color[3] * spec.opacity * strength.value);
  if (!baked) return null;
  const [px, py] = baked.pixels;
  return (
    <Group transform={place}>
      <Rect
        x={c0 * tw}
        y={r0 * th}
        width={(c1 - c0 + 1) * tw}
        height={(r1 - r0 + 1) * th}
        opacity={alpha}
      >
        <ImageShader
          image={baked.image}
          tx="repeat"
          ty="repeat"
          sampling={LINEAR}
          transform={[{ scaleX: tw / px }, { scaleY: th / py }]}
        />
      </Rect>
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
  const layers = useMemo(() => rainLayersFor(atm), [atm.rainSize, atm.rainSize2]);
  const tween = useSceneTween([asNumber(atm.rainOp)]);
  const strength = useDerivedValue(() => tween.value[0] ?? 0);
  if (!tile) return null;
  return (
    <>
      {layers.map((spec) => (
        <RainLayer
          key={spec.periodMs}
          tile={tile}
          spec={spec}
          width={width}
          height={height}
          time={time}
          strength={strength}
        />
      ))}
    </>
  );
}
