import { Canvas, FractalNoise, LinearToSRGBGamma, Rect } from '@shopify/react-native-skia';
import { StyleSheet, useWindowDimensions } from 'react-native';

/**
 * The zine's paper tooth: the prototype's fractal-noise SVG (base frequency .85, two octaves)
 * multiplied over the cover colour at 30%, drawn once in Skia.
 */
export function ZineGrain() {
  const { width, height } = useWindowDimensions();
  return (
    <Canvas
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity: 0.3, mixBlendMode: 'multiply' }]}
    >
      <Rect x={0} y={0} width={width} height={height}>
        <FractalNoise freqX={0.85} freqY={0.85} octaves={2} seed={0} />
        <LinearToSRGBGamma />
      </Rect>
    </Canvas>
  );
}
