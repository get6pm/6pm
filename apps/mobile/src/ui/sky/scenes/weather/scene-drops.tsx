import { Blur, Group, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useSceneTween } from '../use-scene-tween';
import { asNumber, parseDrops, type GlassDrop } from './weather-atm';
import { dropFrame } from './weather-math';

/**
 * A drop on the glass, as the prototype paints it: `border-radius: 50% / 58% 58% 42% 42%` (an egg,
 * fuller on top), a `radial-gradient(circle at 38% 30%, …)` bead, an inset highlight along the
 * bottom edge and a faint shadow beneath it.
 */
const TOP_FRACTION = 0.58;
const GRADIENT_AT = { x: 0.38, y: 0.3 } as const;
const BEAD = [
  [1, 1, 1, 0.8],
  [1, 1, 1, 0.1],
  [0, 20 / 255, 30 / 255, 0.14],
];
const BEAD_AT = [0, 0.1, 0.42, 1];
const BEAD_STOPS = [BEAD[0], BEAD[0], BEAD[1], BEAD[2]];
/** CSS blur radius b is a Gaussian of deviation b / 2. */
const HIGHLIGHT = { dy: -1, sigma: 0.5, color: [1, 1, 1, 0.35] };
const SHADOW = { dy: 1, sigma: 0.75, color: [0, 0, 0, 0.18] };
/** Premultiplied interpolation, as CSS gradients blend. */
const PREMULTIPLIED = 1;

/** The drop outline at the origin: two half-ellipses meeting at 58% of the height. */
export function dropOutline(w: number, h: number): string {
  const mid = h * TOP_FRACTION;
  return `M0 ${mid}A${w / 2} ${mid} 0 0 1 ${w} ${mid}` + `A${w / 2} ${h - mid} 0 0 1 0 ${mid}Z`;
}

function Drop({
  drop,
  width,
  time,
}: {
  drop: GlassDrop;
  width: number;
  time: SharedValue<number>;
}) {
  const { x, y, width: w, height: h, periodMs, delayMs } = drop;
  const outline = useMemo(() => dropOutline(w, h), [w, h]);
  // Everything outside the outline, for the inset highlight (an even-odd frame with the drop cut out).
  const frame = useMemo(
    () => `M${-w} ${-h}h${3 * w}v${3 * h}h${-3 * w}Z${outline}`,
    [outline, w, h],
  );
  const left = x * width;
  const slide = useDerivedValue(() => {
    const f = dropFrame(time.value, periodMs, delayMs);
    return [{ translateX: left }, { translateY: y + f.y }];
  });
  const fade = useDerivedValue(() => dropFrame(time.value, periodMs, delayMs).opacity);
  const centre = vec(GRADIENT_AT.x * w, GRADIENT_AT.y * h);
  // `circle` reaches the farthest corner.
  const reach = Math.hypot((1 - GRADIENT_AT.x) * w, (1 - GRADIENT_AT.y) * h);
  return (
    <Group transform={slide} opacity={fade}>
      <Group clip={outline} invertClip>
        <Group transform={[{ translateY: SHADOW.dy }]}>
          <Path path={outline} color={SHADOW.color}>
            <Blur blur={SHADOW.sigma} />
          </Path>
        </Group>
      </Group>
      <Path path={outline}>
        <RadialGradient
          c={centre}
          r={reach}
          colors={BEAD_STOPS as number[][]}
          positions={BEAD_AT}
          flags={PREMULTIPLIED}
        />
      </Path>
      <Group clip={outline}>
        <Group transform={[{ translateY: HIGHLIGHT.dy }]}>
          <Path path={frame} fillType="evenOdd" color={HIGHLIGHT.color}>
            <Blur blur={HIGHLIGHT.sigma} />
          </Path>
        </Group>
      </Group>
    </Group>
  );
}

interface DropsProps {
  readonly atm: Readonly<Record<string, unknown>>;
  readonly width: number;
  readonly time: SharedValue<number>;
}

/** Drops sliding down the glass: each fades in, slides 260 pt on its own period and fades out. */
export function SceneDrops({ atm, width, time }: DropsProps) {
  const drops = useMemo(() => parseDrops(atm.drops), [atm.drops]);
  const strength = useSceneTween([asNumber(atm.dropsOp)]);
  const opacity = useDerivedValue(() => strength.value[0] ?? 0);
  return (
    <Group opacity={opacity}>
      {drops.map((drop, i) => (
        <Drop key={i} drop={drop} width={width} time={time} />
      ))}
    </Group>
  );
}
