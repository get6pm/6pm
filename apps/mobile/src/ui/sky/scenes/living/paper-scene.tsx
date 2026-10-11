import { useMemo } from 'react';

import { useSceneTween } from '../use-scene-tween';
import type { SceneProps } from '../scene-props';
import { PaperHills } from './paper-hills';
import { geometryKey, paperColors, paperGeometry, PAPER_COLORS_LENGTH } from './paper-model';

const NONE = new Array<number>(PAPER_COLORS_LENGTH).fill(0);

/** Paper Diorama: paper clouds and five parallax layers of hand-cut hills. */
export function PaperScene({ atm, time, scrollY, width }: SceneProps) {
  const key = geometryKey(atm, width);
  // The shape only changes with the variant, the switches or the width; the hour changes colours.
  const geometry = useMemo(() => paperGeometry(atm, width), [key]);
  const colors = useSceneTween(paperColors(atm) ?? NONE);
  if (!geometry) return null;
  return (
    <PaperHills geometry={geometry} colors={colors} time={time} scrollY={scrollY} width={width} />
  );
}
