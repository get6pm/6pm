import { BlurMask, Group, Path } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useSceneTween } from '../use-scene-tween';
import {
  RAIN_OVERHANG,
  RAIN_TILT_DEG,
  rainLayersFor,
  rainPath,
  strokeGroups,
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
  readonly strength: SharedValue<number>;
}

function RainLayer({ tile, spec, width, height, time, strength }: LayerProps) {
  const groups = useMemo(
    () =>
      strokeGroups(tile).map((g) => ({
        ...g,
        d: rainPath(tile, g.strokes, spec, width, height),
      })),
    [tile, spec, width, height],
  );
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
  const scaleX = tw / tile.width;
  const scaleY = th / tile.height;
  const scale = [{ scaleX }, { scaleY }];
  // The layer's opacity and the hour's rain strength ride on the strokes' own alpha: one path is one
  // coverage, so this equals fading a layer, without an offscreen layer per frame.
  const alpha = useDerivedValue(() => tile.color[3] * spec.opacity * strength.value);
  // The soft layer's blur is a mask on the strokes. The mask scales with the tile's squeeze, so the
  // deviation is divided by it to keep spec.blur on screen.
  const blur = spec.blur / Math.sqrt(scaleX * scaleY);
  return (
    <Group transform={place}>
      <Group transform={scale}>
        {groups.map((g) => (
          <Stroke
            key={`${g.width}|${g.opacity}`}
            d={g.d}
            width={g.width}
            ink={g.opacity}
            tile={tile}
            alpha={alpha}
            blur={spec.blur > 0 ? blur : 0}
          />
        ))}
      </Group>
    </Group>
  );
}

/** One weight and ink of the tile's strokes, as one path. */
function Stroke({
  d,
  width,
  ink,
  tile,
  alpha,
  blur,
}: {
  readonly d: string;
  readonly width: number;
  readonly ink: number;
  readonly tile: RainTile;
  readonly alpha: SharedValue<number>;
  readonly blur: number;
}) {
  const color = useDerivedValue(() => {
    const [r, g, b] = tile.color;
    return [r, g, b, alpha.value * ink];
  });
  return (
    <Path path={d} style="stroke" strokeWidth={width} strokeCap="round" color={color}>
      {blur > 0 ? <BlurMask blur={blur} style="normal" respectCTM /> : null}
    </Path>
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
