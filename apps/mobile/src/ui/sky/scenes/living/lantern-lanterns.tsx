import {
  BlurMask,
  Group,
  Path,
  RadialGradient,
  Rect,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { alternating } from '../../css-keyframes';
import { colorsAt } from '../../sky-slots';
import { boxPath, parseBorderRadius } from './box-path';
import { LANTERN_VALUES, type Lantern } from './lantern-model';
import { usePath } from './use-path';

/** `@keyframes sway`: rotate −4° to 4°. */
const SWAY_DEG = 4;
/** Fixed parts of a lantern, from the prototype's markup. */
const CORD_COLOR = 'rgba(40,20,10,0.55)';
const CAP_COLOR = '#3a2014';
const CAP_HEIGHT = 4;
const CAP_SHARE = 0.56;
const TASSEL_WIDTH = 2;

interface Props {
  readonly lantern: Lantern;
  readonly index: number;
  /** The lanterns' hour-driven numbers (see `LANTERN_VALUES`). */
  readonly values: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  /** The phone's pendulum swing (`--pend`). */
  readonly pend: SharedValue<number>;
}

function LanternShape({ lantern, index, values, time, pend }: Props) {
  const { x, y, w, h, cord, tassel, opacity, stops, rib, sway, pendDeg } = lantern;
  const at = index * LANTERN_VALUES;
  const bodyTop = cord + CAP_HEIGHT;
  const corners = parseBorderRadius('42% / 50%', w, h);
  const body = usePath(boxPath(0, bodyTop, w, h, corners));
  const capW = w * CAP_SHARE;

  const transform = useDerivedValue(() => {
    const turn = sway
      ? ((2 * alternating(time.value - sway.delayMs, sway.durationMs) - 1) * SWAY_DEG * Math.PI) /
        180
      : 0;
    const swing = turn + (pendDeg * pend.value * Math.PI) / 180;
    // Hangs from the top of its cord, swinging about it.
    return [
      { translateX: x + w / 2 },
      { translateY: y },
      { rotate: swing },
      { translateX: -w / 2 },
    ];
  });
  const silk = useDerivedValue(() => colorsAt(values.value, at, 3));
  const glowColor = useDerivedValue(() => colorsAt(values.value, at + 12, 1)[0] ?? [0, 0, 0, 0]);
  const spread = useDerivedValue(() => values.value[at + 17] ?? 0);
  const sigma = useDerivedValue(() => values.value[at + 16] ?? 0);
  const glowY = useDerivedValue(() => bodyTop - spread.value);
  const glowX = useDerivedValue(() => -spread.value);
  const glowW = useDerivedValue(() => w + 2 * spread.value);
  const glowH = useDerivedValue(() => h + 2 * spread.value);
  const glowR = useDerivedValue(() =>
    vec(corners.tl.x + spread.value, corners.tl.y + spread.value),
  );

  // Paper ribs: 1 pt lines every `period` pt after the clear gap, over the silk.
  const ribsD = rib
    ? Array.from({ length: Math.ceil(w / rib.period) }, (_, k) => {
        const rx = rib.gap + k * rib.period;
        return `M${rx} ${bodyTop}h1v${h}h-1Z`;
      }).join('')
    : '';
  const ribs = usePath(ribsD);
  const tint = rib ? [...rib.ink] : [0, 0, 0, 0];
  if (!body) return null;

  return (
    <Group transform={transform} opacity={opacity}>
      <Rect x={(w - 1) / 2} y={0} width={1} height={cord} color={CORD_COLOR} />
      <RoundedRect
        x={(w - capW) / 2}
        y={cord}
        width={capW}
        height={CAP_HEIGHT}
        r={CAP_HEIGHT / 2}
        color={CAP_COLOR}
      />
      <Group clip={body} invertClip>
        <RoundedRect x={glowX} y={glowY} width={glowW} height={glowH} r={glowR} color={glowColor}>
          <BlurMask blur={sigma} style="normal" respectCTM />
        </RoundedRect>
      </Group>
      <Path path={body}>
        <RadialGradient
          c={vec(w / 2, bodyTop + 0.46 * h)}
          r={Math.hypot(w / 2, 0.54 * h)}
          colors={silk}
          positions={stops as number[]}
        />
      </Path>
      {rib && ribs && (
        <Group clip={body}>
          <Path path={ribs} color={tint} />
        </Group>
      )}
      <RoundedRect
        x={(w - capW) / 2}
        y={bodyTop + h}
        width={capW}
        height={CAP_HEIGHT}
        r={CAP_HEIGHT / 2}
        color={CAP_COLOR}
      />
      <RoundedRect
        x={(w - TASSEL_WIDTH) / 2}
        y={bodyTop + h + CAP_HEIGHT}
        width={TASSEL_WIDTH}
        height={tassel}
        r={TASSEL_WIDTH / 2}
        color={[...lantern.tasselColor]}
      />
    </Group>
  );
}

interface LanternsProps {
  readonly lanterns: readonly Lantern[];
  readonly values: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  readonly pend: SharedValue<number>;
}

/** Silk lanterns hung from the strings, each swinging on its own period and with the phone. */
export function Lanterns({ lanterns, values, time, pend }: LanternsProps) {
  return (
    <>
      {lanterns.map((lantern, i) => (
        <LanternShape key={i} lantern={lantern} index={i} values={values} time={time} pend={pend} />
      ))}
    </>
  );
}
