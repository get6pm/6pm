import { LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import type { SkyLayerProps } from './sky-layer-props';
import { colorsAt, SLOT } from './sky-slots';

const STOPS = [0, 0.52, 1];

/**
 * The sky: `linear-gradient(180deg, top 0%, middle 52%, bottom 100%)`. Dithered, because a
 * night sky spans a dozen 8-bit steps over the whole screen and would band without it.
 */
export function SkyGradient({
  frame,
  width,
  height,
}: Pick<SkyLayerProps, 'frame' | 'width' | 'height'>) {
  const colors = useDerivedValue(() => colorsAt(frame.value, SLOT.sky, 3));
  return (
    <Rect x={0} y={0} width={width} height={height} dither>
      <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={colors} positions={STOPS} />
    </Rect>
  );
}
