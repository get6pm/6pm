import { RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { radialGradientShape } from './css-geometry';
import type { SkyLayerProps } from './sky-layer-props';
import { colorAt, SLOT } from './sky-slots';

/**
 * The vignette: `radial-gradient(130% 95% at 50% 38%, transparent 48%, <shade> 100%)`, deeper after
 * dark. The clear stop carries the shade's own colour so it fades the way CSS fades (premultiplied).
 */
export function SkyVignette({
  frame,
  layout,
  width,
  height,
}: Pick<SkyLayerProps, 'frame' | 'layout' | 'width' | 'height'>) {
  const { c, rx, ry } = radialGradientShape(layout.vignette.value, width, height);
  const colors = useDerivedValue(() => [
    colorAt(frame.value, SLOT.vignette, 0),
    colorAt(frame.value, SLOT.vignette),
  ]);
  return (
    <Rect x={0} y={0} width={width} height={height} dither>
      <RadialGradient
        c={vec(c.x, c.y)}
        r={rx}
        colors={colors}
        positions={layout.vignette.at as number[]}
        origin={vec(c.x, c.y)}
        transform={[{ scaleY: rx > 0 ? ry / rx : 1 }]}
      />
    </Rect>
  );
}
