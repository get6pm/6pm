import { Rect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { flashOpacity } from './weather-math';

/** The prototype's lightning wash (`background:#dfeeff; mix-blend-mode:screen`). */
const LIGHTNING = '#dfeeff';

interface FlashProps {
  readonly width: number;
  readonly height: number;
  readonly time: SharedValue<number>;
}

/** Lightning: the whole sky strobes twice, screened, once every 11 s after a 2 s wait. */
export function SceneFlash({ width, height, time }: FlashProps) {
  const opacity = useDerivedValue(() => flashOpacity(time.value));
  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      color={LIGHTNING}
      blendMode="screen"
      opacity={opacity}
    />
  );
}
