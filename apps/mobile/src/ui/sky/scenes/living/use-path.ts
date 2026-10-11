import { Skia, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';

/**
 * An SVG path built once into a Skia path, so the canvas does not parse the string again every
 * frame. Null when the string is not a path.
 */
export function usePath(d: string): SkPath | null {
  return useMemo(() => Skia.Path.MakeFromSVGString(d), [d]);
}
