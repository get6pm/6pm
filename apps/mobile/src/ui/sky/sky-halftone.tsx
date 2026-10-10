import { Group, Rect, Shader, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import type { SkyLayerProps } from './sky-layer-props';
import { SLOT } from './sky-slots';

/** The halftone band: 280 pt tall from 220 pt down, faded in to 45% and out after 60%. */
const TOP = 220;
const HEIGHT = 280;

/**
 * `radial-gradient(circle, dot 0.9px, transparent 1.5px)` tiled every `cell` points, under a
 * `linear-gradient(transparent 0%, #000 45%, #000 60%, transparent 100%)` mask.
 */
const HALFTONE = Skia.RuntimeEffect.Make(`
uniform float4 ink;
uniform float cell;
uniform float height;

half4 main(float2 p) {
  float2 q = mod(p, cell) - 0.5 * cell;
  float coverage = clamp((1.5 - length(q)) / 0.6, 0.0, 1.0);
  float y = p.y / height;
  float mask = y < 0.45 ? y / 0.45 : (y < 0.6 ? 1.0 : (1.0 - y) / 0.4);
  float a = ink.a * coverage * clamp(mask, 0.0, 1.0);
  return half4(ink.rgb * a, a);
}
`);

/** Golden Hour's dot screen across the middle of the sky; rises with the scroll at 0.35×. */
export function SkyHalftone({
  frame,
  layout,
  width,
}: Pick<SkyLayerProps, 'frame' | 'layout' | 'width'>) {
  const opacity = useDerivedValue(() => frame.value[SLOT.dotOp] ?? 0);
  const cell = layout.dotCell;
  const uniforms = useDerivedValue(() => {
    const v = frame.value;
    const at = SLOT.dot;
    return {
      ink: [v[at] ?? 0, v[at + 1] ?? 0, v[at + 2] ?? 0, v[at + 3] ?? 0],
      cell,
      height: HEIGHT,
    };
  });
  if (!HALFTONE) return null;
  return (
    <Group transform={[{ translateY: TOP }]}>
      <Rect x={0} y={0} width={width} height={HEIGHT} blendMode={layout.dotBlend} opacity={opacity}>
        <Shader source={HALFTONE} uniforms={uniforms} />
      </Rect>
    </Group>
  );
}
