import {
  Blur,
  Canvas,
  ColorMatrix,
  Group,
  LinearGradient,
  Paint,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { paletteFor, type LookConfig, type LookId } from '@6pm/theme';

import { PAID_LOOKS } from './products';

/** CSS `saturate(s)` as a colour matrix. */
function saturate(s: number): number[] {
  const r = 0.213;
  const g = 0.715;
  const b = 0.072;
  return [
    r + (1 - r) * s,
    g - g * s,
    b - b * s,
    0,
    0,
    r - r * s,
    g + (1 - g) * s,
    b - b * s,
    0,
    0,
    r - r * s,
    g - g * s,
    b + (1 - b) * s,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
}

/** The nine paid looks' skies at this hour, top to bottom, each look's own settings applied. */
export function paidSkies(
  hour: number,
  configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>,
): readonly (readonly [string, string, string])[] {
  return PAID_LOOKS.map((look) => {
    const { st } = paletteFor({ look, hour, serious: false, config: configs[look] ?? {} });
    return [st[0], st[1], st[2]] as const;
  });
}

/**
 * The paid looks' skies as nine vertical bands, blurred into one wash of colour (the prototype's
 * `filter: blur() saturate()` over a row of gradients, `App:988` and `App:1066`). It fills its
 * box and bleeds `inset` past it on every side.
 */
export function MaxGlow({
  hour,
  configs,
  blur,
  saturation,
  opacity,
  inset,
}: {
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly blur: number;
  readonly saturation: number;
  readonly opacity: number;
  readonly inset: number;
}) {
  const [size, setSize] = useState<{ readonly w: number; readonly h: number } | null>(null);
  const skies = useMemo(() => paidSkies(hour, configs), [hour, configs]);
  const matrix = useMemo(() => saturate(saturation), [saturation]);
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { margin: -inset }]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size ? (
        <Canvas style={{ width: size.w, height: size.h }}>
          <Group
            layer={
              <Paint opacity={opacity}>
                <Blur blur={blur} mode="clamp" />
                <ColorMatrix matrix={matrix} />
              </Paint>
            }
          >
            {skies.map(([top, middle, bottom], i) => {
              // Bands are 11.2% wide and spread so the first sits at the left edge, the last at the right.
              const band = size.w * 0.112;
              const x = (i / (skies.length - 1)) * (size.w - band);
              return (
                <Rect key={PAID_LOOKS[i]} x={x} y={0} width={band} height={size.h}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, size.h)}
                    colors={[top, middle, bottom]}
                    positions={[0, 0.55, 1]}
                  />
                </Rect>
              );
            })}
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}
