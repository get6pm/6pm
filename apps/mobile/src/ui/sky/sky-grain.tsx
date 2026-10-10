import {
  FractalNoise,
  Group,
  ImageShader,
  LinearToSRGBGamma,
  Rect,
  useTexture,
} from '@shopify/react-native-skia';
import { PixelRatio } from 'react-native';
import { useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { SkyLayerProps } from './sky-layer-props';
import { grainOffset, grainStep } from './css-keyframes';
import { SLOT } from './sky-slots';

/** The prototype's grain is a 180 pt SVG tile repeated over the sky. */
const TILE = 180;
/**
 * Its `feTurbulence` stitches over the SVG filter region, which by default overhangs the tile by
 * 10% on every side (216 pt), and runs in linearRGB before the browser shows it in sRGB. Skia's
 * fractal noise is the same algorithm the browser uses, so with the same seed and stitch size it
 * draws the same grain, pixel for pixel.
 */
const STITCH = 216;

/** The grain tile, drawn once at the screen's pixel density. */
function useGrainTile(scale: number) {
  return useTexture(
    <Group transform={[{ scale }]}>
      <Rect x={0} y={0} width={TILE} height={TILE}>
        <FractalNoise
          freqX={0.85}
          freqY={0.85}
          octaves={2}
          seed={0}
          tileWidth={STITCH}
          tileHeight={STITCH}
        />
        <LinearToSRGBGamma />
      </Rect>
    </Group>,
    { width: Math.round(TILE * scale), height: Math.round(TILE * scale) },
    [scale],
  );
}

/**
 * Film grain over the whole sky, overlay-blended, jumping between three offsets every 0.8 s like
 * the prototype's stepped `grain` animation.
 */
export function SkyGrain({ frame, layout, width, height, time }: SkyLayerProps) {
  const scale = PixelRatio.get();
  const tile = useGrainTile(scale);
  // Nothing until the tile exists: an empty image shader would paint black.
  const opacity = useDerivedValue(() => (tile.value ? (frame.value[SLOT.grainOp] ?? 0) : 0));
  // Only a new step moves the grain: the canvas stays idle between steps when nothing else moves.
  const stepAt = useSharedValue(0);
  useAnimatedReaction(
    () => grainStep(time.value),
    (step, previous) => {
      if (step !== previous) stepAt.value = time.value;
    },
  );
  const transform = useDerivedValue(() => {
    const [x, y] = grainOffset(stepAt.value);
    return [{ translateX: x }, { translateY: y }, { scale: 1 / scale }];
  });
  return (
    <Rect x={0} y={0} width={width} height={height} blendMode={layout.grainBlend} opacity={opacity}>
      <ImageShader image={tile} tx="repeat" ty="repeat" transform={transform} />
    </Rect>
  );
}
