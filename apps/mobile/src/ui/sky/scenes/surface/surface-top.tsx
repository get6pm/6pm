import { Blend, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import type { SceneProps } from '../scene-props';
import { useSceneTween } from '../use-scene-tween';
import { numberOf } from './surface-css';
import { CRT_BAR, crtBarTop } from './surface-motion';

/**
 * The CRT of the prototype's markup: `repeating-linear-gradient(180deg, rgba(0,0,0,.42) 0 1px,
 * transparent 1px 3px)` under a 120 pt `linear-gradient(180deg, transparent, rgba(255,255,255,.07),
 * transparent)` bar rolling down every 7 s.
 */
const SCANLINE = { alpha: 0.42, on: 1, period: 3 };
const BAR_ALPHA = 0.07;

function Crt({ scene }: { scene: SceneProps }) {
  const { atm, width, height, time } = scene;
  const tween = useSceneTween([numberOf(atm, 'crtOp')]);
  const opacity = useDerivedValue(() => tween.value[0] ?? 0);
  const top = useDerivedValue(() => crtBarTop(time.value, height));
  const barStart = useDerivedValue(() => vec(0, top.value));
  const barEnd = useDerivedValue(() => vec(0, top.value + CRT_BAR));
  const { alpha, on, period } = SCANLINE;
  const at = on / period;
  return (
    <Rect x={0} y={0} width={width} height={height} opacity={opacity}>
      {/* Both layers composite into one group, then the container's opacity applies. */}
      <Blend mode="srcOver">
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, period)}
          colors={[
            [0, 0, 0, alpha],
            [0, 0, 0, alpha],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
          ]}
          positions={[0, at, at, 1]}
          mode="repeat"
        />
        <LinearGradient
          start={barStart}
          end={barEnd}
          colors={[
            [1, 1, 1, 0],
            [1, 1, 1, BAR_ALPHA],
            [1, 1, 1, 0],
          ]}
          mode="decal"
        />
      </Blend>
    </Rect>
  );
}

/**
 * Arcade's CRT over the whole screen: scanlines every 3 pt and a faint bar rolling down every 7 s,
 * at the look's strength. Mount it after the grain (it sits over everything, content included, in
 * the prototype). Returns null when "Scanlines" is off or for any other look.
 */
export function SurfaceTop(scene: SceneProps) {
  if (scene.atm.crtOn !== true) return null;
  return <Crt scene={scene} />;
}
