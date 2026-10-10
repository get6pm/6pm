import {
  BlurMask,
  Circle,
  Group,
  RadialGradient,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import type { SkyLayerProps } from './sky-layer-props';
import { colorAt, SLOT, SUN_RINGS, SUN_STOPS } from './sky-slots';

/** The prototype raises the sun, its flare and the halftone at 0.35× the list's scroll. */
export const SUN_PARALLAX = 0.35;

function Ring({
  index,
  frame,
  cx,
  cy,
}: {
  readonly index: number;
  readonly frame: SharedValue<number[]>;
  readonly cx: SharedValue<number>;
  readonly cy: SharedValue<number>;
}) {
  const spread = useDerivedValue(() => frame.value[SLOT.ringSpread + index] ?? 0);
  // A spread shadow outside the disc is an annulus from the disc's edge out to `spread`.
  const r = useDerivedValue(() => (frame.value[SLOT.sunSize] ?? 0) / 2 + spread.value / 2);
  const color = useDerivedValue(() =>
    colorAt(frame.value, SLOT.rings + 4 * index, frame.value[SLOT.sunOp] ?? 0),
  );
  return <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={spread} color={color} />;
}

/**
 * The sun: a radial-gradient disc with its box-shadow glow (hard rings plus one blurred halo, all
 * outside the disc), at the look's colours for the hour. It rises with the list's scroll at 0.35×.
 */
export function SkySun({ frame, width }: Pick<SkyLayerProps, 'frame' | 'width'>) {
  const cx = useDerivedValue(() => (frame.value[SLOT.sunX] ?? 0) * width);
  const cy = useDerivedValue(() => frame.value[SLOT.sunY] ?? 0);
  const radius = useDerivedValue(() => (frame.value[SLOT.sunSize] ?? 0) / 2);
  const opacity = useDerivedValue(() => frame.value[SLOT.sunOp] ?? 0);

  const disc = useDerivedValue(() => {
    const r = radius.value;
    return rrect(rect(cx.value - r, cy.value - r, 2 * r, 2 * r), r, r);
  });
  const haloR = useDerivedValue(() => radius.value + (frame.value[SLOT.haloSpread] ?? 0));
  const haloSigma = useDerivedValue(() => frame.value[SLOT.haloSigma] ?? 0);
  const haloColor = useDerivedValue(() => colorAt(frame.value, SLOT.halo, opacity.value));

  // `radial-gradient(circle at 50% <focus>, …)` over the disc's box: farthest-corner radius.
  const focus = useDerivedValue(() => {
    const size = 2 * radius.value;
    const fy = frame.value[SLOT.sunFocusY] ?? 0.5;
    return {
      c: vec(cx.value, cy.value - radius.value + fy * size),
      r: size * Math.hypot(0.5, Math.max(fy, 1 - fy)),
    };
  });
  const focusC = useDerivedValue(() => focus.value.c);
  const focusR = useDerivedValue(() => focus.value.r);
  const stops = useDerivedValue(() => {
    const out: number[][] = [];
    for (let i = 0; i < SUN_STOPS; i++) out.push(colorAt(frame.value, SLOT.sunStops + 4 * i));
    return out;
  });
  const stopAt = useDerivedValue(() =>
    frame.value.slice(SLOT.sunStopAt, SLOT.sunStopAt + SUN_STOPS),
  );

  return (
    <>
      <Group clip={disc} invertClip>
        <Circle cx={cx} cy={cy} r={haloR} color={haloColor}>
          <BlurMask blur={haloSigma} style="normal" respectCTM />
        </Circle>
        {/* Box shadows paint the first one on top: draw the widest ring first. */}
        {Array.from({ length: SUN_RINGS }, (_, i) => SUN_RINGS - 1 - i).map((i) => (
          <Ring key={i} index={i} frame={frame} cx={cx} cy={cy} />
        ))}
      </Group>
      <Circle cx={cx} cy={cy} r={radius} opacity={opacity}>
        <RadialGradient c={focusC} r={focusR} colors={stops} positions={stopAt} />
      </Circle>
    </>
  );
}
