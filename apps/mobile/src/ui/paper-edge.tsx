import { Canvas, Circle, Group, Rect } from '@shopify/react-native-skia';
import { useState } from 'react';
import { View } from 'react-native';

/**
 * The torn bottom edge of a receipt: a strip of paper with semicircles bitten out every `step`
 * points (the prototype's radial-gradient scallop), drawn once in Skia.
 */
export function PaperEdge({
  color,
  height = 9,
  step = 12,
  radius = 5.75,
}: {
  readonly color: string;
  readonly height?: number;
  readonly step?: number;
  readonly radius?: number;
}) {
  const [width, setWidth] = useState(0);
  const bites = Math.ceil(width / step) + 1;
  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Canvas style={{ width, height }}>
          <Group layer>
            <Rect x={0} y={0} width={width} height={height} color={color} />
            {Array.from({ length: bites }, (_, i) => (
              <Circle
                key={i}
                cx={i * step + step / 2}
                cy={height}
                r={radius}
                color="black"
                blendMode="clear"
              />
            ))}
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}
