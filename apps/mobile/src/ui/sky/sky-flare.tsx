import { BlurMask, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import type { SkyLayerProps } from './sky-layer-props';
import { colorsAt, SLOT, STREAK_STOPS } from './sky-slots';

interface StreakProps {
  readonly frame: SharedValue<number[]>;
  readonly stops: readonly number[];
  /** Horizontal overhang past each screen edge, as a fraction of the width. */
  readonly overhang: number;
  readonly height: number;
  readonly sigma: number;
  readonly opacitySlot: number;
  readonly width: number;
}

function Streak({ frame, stops, overhang, height, sigma, opacitySlot, width }: StreakProps) {
  const x = -overhang * width;
  const w = width * (1 + 2 * overhang);
  const y = useDerivedValue(() => (frame.value[SLOT.sunY] ?? 0) - height / 2);
  const opacity = useDerivedValue(() => frame.value[opacitySlot] ?? 0);
  const colors = useDerivedValue(() => colorsAt(frame.value, SLOT.streak, STREAK_STOPS));
  return (
    <Rect x={x} y={y} width={w} height={height} blendMode="screen" opacity={opacity}>
      <LinearGradient
        start={vec(x, 0)}
        end={vec(x + w, 0)}
        colors={colors}
        positions={stops as number[]}
      />
      <BlurMask blur={sigma} style="normal" respectCTM />
    </Rect>
  );
}

/**
 * The lens flare: a horizontal streak through the sun's height, a soft 34 pt band blurred by 12 and
 * a 2 pt line blurred by 0.6, both screened over the sky. Golden Hour weights it towards dusk.
 */
export function SkyFlare({
  frame,
  layout,
  width,
}: Pick<SkyLayerProps, 'frame' | 'layout' | 'width'>) {
  return (
    <>
      <Streak
        frame={frame}
        stops={layout.streakAt}
        overhang={0.2}
        height={34}
        sigma={12}
        opacitySlot={SLOT.streakSoft}
        width={width}
      />
      <Streak
        frame={frame}
        stops={layout.streakAt}
        overhang={0.1}
        height={2}
        sigma={0.6}
        opacitySlot={SLOT.streakOp}
        width={width}
      />
    </>
  );
}
