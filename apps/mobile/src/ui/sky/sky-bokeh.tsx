import { BlurMask, Circle, Group, rect, rrect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import type { BokehSpot } from './sky-frame';
import type { SkyLayerProps } from './sky-layer-props';
import { alternating } from './css-keyframes';
import { colorAt, SLOT } from './sky-slots';

/** Every bokeh light carries `filter: blur(2px)`. */
const SOFTEN = 2;

function Light({
  spot,
  index,
  frame,
  time,
  width,
}: {
  readonly spot: BokehSpot;
  readonly index: number;
  readonly frame: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  readonly width: number;
}) {
  const r = spot.size / 2;
  const cx = spot.x * width + r;
  const cy = spot.y + r;
  const { periodMs, glowSigma } = spot;
  // `@keyframes twinkle`: opacity .35 → 1 and scale .85 → 1.1, eased, back and forth.
  const twinkle = useDerivedValue(() => alternating(time.value, periodMs));
  const transform = useDerivedValue(() => {
    const s = 0.85 + 0.25 * twinkle.value;
    return [
      { translateX: cx },
      { translateY: cy },
      { scale: s },
      { translateX: -cx },
      { translateY: -cy },
    ];
  });
  const color = useDerivedValue(() =>
    colorAt(
      frame.value,
      SLOT.bokeh + 4 * index,
      (frame.value[SLOT.bokehOp] ?? 0) * (0.35 + 0.65 * twinkle.value),
    ),
  );
  const disc = rrect(rect(cx - r, cy - r, 2 * r, 2 * r), r, r);
  return (
    <Group transform={transform}>
      <Group clip={disc} invertClip>
        <Circle cx={cx} cy={cy} r={r} color={color} blendMode="screen">
          <BlurMask blur={Math.hypot(glowSigma, SOFTEN)} style="normal" respectCTM />
        </Circle>
      </Group>
      <Circle cx={cx} cy={cy} r={r} color={color} blendMode="screen">
        <BlurMask blur={SOFTEN} style="normal" respectCTM />
      </Circle>
    </Group>
  );
}

/**
 * City-light bokeh after dusk (Golden Hour from 18:36): soft discs with their own glow that twinkle
 * on their own periods, screened over the sky and rising at 0.2× the scroll.
 */
export function SkyBokeh({
  frame,
  layout,
  time,
  width,
}: Pick<SkyLayerProps, 'frame' | 'layout' | 'time' | 'width'>) {
  return (
    <>
      {layout.bokeh.map((spot, i) => (
        <Light
          key={`${spot.x}-${spot.y}`}
          spot={spot}
          index={i}
          frame={frame}
          time={time}
          width={width}
        />
      ))}
    </>
  );
}
