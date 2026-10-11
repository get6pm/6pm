import { Canvas, Circle, Rect, SweepGradient, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Conic, Hatch, Rings, SigSun } from './look-signature';

/** CSS `color from to` as two stops: React Native's gradients take one position per stop. */
const band = (color: string, from: string, to: string) => `${color} ${from}, ${color} ${to}`;

/**
 * Slanted hairlines: one tile of a vertical line, repeated across a box wider than the card and
 * turned, so the whole card is covered whatever its size.
 */
export function HatchLines({ hatch }: { readonly hatch: Hatch }) {
  const reach = 520;
  const gap = hatch.every - 1;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: reach,
          height: reach,
          marginLeft: -reach / 2,
          marginTop: -reach / 2,
          transform: [{ rotate: `${hatch.angle - 90}deg` }],
          backgroundImage: `linear-gradient(90deg, ${band('transparent', '0px', `${gap}px`)}, ${band(hatch.color, `${gap}px`, `${hatch.every}px`)})`,
          backgroundSize: `${hatch.every}px 100%`,
          backgroundRepeat: 'repeat',
        }}
      />
    </View>
  );
}

/** Concentric rings and a conic sweep, which CSS gradients draw and React Native's cannot. */
export function SweepAndRings({
  rings,
  conic,
}: {
  readonly rings: Rings | null;
  readonly conic: Conic | null;
}) {
  const [size, setSize] = useState<{ readonly w: number; readonly h: number } | null>(null);
  const ringRadii: number[] = [];
  if (size && rings) {
    const cx = (size.w * rings.x) / 100;
    const cy = (size.h * rings.y) / 100;
    const reach = Math.hypot(Math.max(cx, size.w - cx), Math.max(cy, size.h - cy));
    for (let r = rings.every; r - 0.5 <= reach; r += rings.every) ringRadii.push(r - 0.5);
  }
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size ? (
        <Canvas style={{ width: size.w, height: size.h }}>
          {conic ? (
            <Rect x={0} y={0} width={size.w} height={size.h}>
              <SweepGradient
                c={vec((size.w * conic.x) / 100, (size.h * conic.y) / 100)}
                start={conic.from - 90}
                end={conic.from + 270}
                colors={[...conic.colors]}
              />
            </Rect>
          ) : null}
          {rings
            ? ringRadii.map((r) => (
                <Circle
                  key={r}
                  cx={(size.w * rings.x) / 100}
                  cy={(size.h * rings.y) / 100}
                  r={r}
                  style="stroke"
                  strokeWidth={1}
                  color={rings.color}
                />
              ))
            : null}
        </Canvas>
      ) : null}
    </View>
  );
}

/** The sun of a look card: a gradient or colour disc with its glow, or a conic sweep for Holo Foil. */
export function PreviewSun({
  sun,
  size,
  left,
  top,
}: {
  readonly sun: SigSun;
  readonly size: number;
  readonly left: `${number}%`;
  readonly top: number;
}) {
  if (!sun.image && !sun.color && !sun.conic) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: size / 2,
        ...(sun.glow === 'none' ? {} : { boxShadow: sun.glow }),
        ...(sun.image ? { backgroundImage: sun.image } : {}),
        ...(sun.color ? { backgroundColor: sun.color } : {}),
      }}
    >
      {sun.conic ? (
        <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, overflow: 'hidden' }]}>
          <SweepAndRings rings={null} conic={sun.conic} />
        </View>
      ) : null}
    </View>
  );
}
