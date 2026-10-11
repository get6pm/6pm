import {
  Blur,
  Group,
  Image,
  Rect,
  SweepGradient,
  useTexture,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { spinAngle } from './surface-motion';

/**
 * The foil of the prototype's markup: `conic-gradient(from 0deg, #ff8fd0, #ffd88f, #a8ff9a, #8fe8ff,
 * #b49aff, #ff8fd0)` on a 1100 pt square, blurred by 24 pt, centred at 50% / 45% of the screen.
 */
const FOIL = ['#ff8fd0', '#ffd88f', '#a8ff9a', '#8fe8ff', '#b49aff', '#ff8fd0'];
const SIDE = 1100;
const BLUR = 24;
/** The blur spreads past the square; keep three sigmas of it. */
const MARGIN = 3 * BLUR;
const TEXTURE = SIDE + 2 * MARGIN;
const CENTER_Y = 0.45;

/**
 * The blurred foil, drawn once into a texture and then only rotated. A live 24 pt blur of a
 * full-screen square every frame would cost far more than turning one image.
 */
function useFoilTexture() {
  const mid = MARGIN + SIDE / 2;
  return useTexture(
    <Rect x={MARGIN} y={MARGIN} width={SIDE} height={SIDE}>
      {/* CSS conic gradients start at 12 o'clock; Skia's sweep starts at 3 o'clock. */}
      <SweepGradient
        c={vec(mid, mid)}
        colors={FOIL}
        origin={vec(mid, mid)}
        transform={[{ rotate: -Math.PI / 2 }]}
      />
      <Blur blur={BLUR} />
    </Rect>,
    { width: TEXTURE, height: TEXTURE },
  );
}

/**
 * Holo Foil's rainbow wash: the foil turning once every `periodMs` (22 s, or 7 s with "Fast
 * shimmer"), overlay-blended at the look's strength.
 */
export function HoloFoil({
  opacity,
  periodMs,
  width,
  height,
  time,
}: {
  readonly opacity: SharedValue<number>;
  readonly periodMs: number;
  readonly width: number;
  readonly height: number;
  readonly time: SharedValue<number>;
}) {
  const foil = useFoilTexture();
  // Nothing until the texture exists: an empty image would draw black.
  const alpha = useDerivedValue(() => (foil.value ? opacity.value : 0));
  const transform = useDerivedValue(() => [
    { translateX: width / 2 },
    { translateY: CENTER_Y * height },
    { rotate: spinAngle(time.value, periodMs) },
    { translateX: -TEXTURE / 2 },
    { translateY: -TEXTURE / 2 },
  ]);
  return (
    <Group transform={transform} blendMode="overlay" opacity={alpha}>
      <Image image={foil} x={0} y={0} width={TEXTURE} height={TEXTURE} fit="fill" />
    </Group>
  );
}
