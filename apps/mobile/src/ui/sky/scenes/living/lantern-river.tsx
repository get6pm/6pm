import {
  BlurMask,
  Group,
  LinearGradient,
  Paint,
  RadialGradient,
  Rect,
  RoundedRect,
  Path,
  rect,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { alternating } from '../../css-keyframes';
import { radialGradientShape } from '../../css-geometry';
import { colorAt } from '../../sky-slots';
import { boxPath, parseBorderRadius } from './box-path';
import { usePath } from './use-path';
import {
  FLOAT_FROM,
  FLOAT_H,
  FLOAT_TRAVEL,
  FLOAT_VALUES,
  FLOAT_W,
  floatProgress,
  RIVER_HEIGHT,
  RIVER_TOP,
  type Floater,
  type RiverLayer,
} from './river-model';

/** `@keyframes ripple`: slide ±4 pt and stretch to 1.06× tall, eased, back and forth every 3.6 s. */
const RIPPLE_MS = 3600;
const RIPPLE_SLIDE = 4;
const RIPPLE_STRETCH = 0.06;
/** The river is cut into 2 pt lines every 5 pt. */
const LINE = 2;
const LINE_PERIOD = 5;

const LINES_D = Array.from(
  { length: Math.ceil(RIVER_HEIGHT / LINE_PERIOD) },
  (_, k) => `M0 ${k * LINE_PERIOD}h4000v${LINE}h-4000Z`,
).join('');

interface LayerProps {
  readonly layer: RiverLayer;
  readonly index: number;
  readonly colors: SharedValue<number[]>;
  readonly width: number;
}

function RiverWash({ layer, index, colors, width }: LayerProps) {
  const { gradient, positions } = layer;
  const stops = useDerivedValue(() => [
    colorAt(colors.value, 1 + 8 * index),
    colorAt(colors.value, 5 + 8 * index),
  ]);
  if (gradient.kind === 'linear') {
    return (
      <Rect x={0} y={0} width={width} height={RIVER_HEIGHT}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, RIVER_HEIGHT)}
          colors={stops}
          positions={positions as number[]}
        />
      </Rect>
    );
  }
  const { c, rx, ry } = radialGradientShape(gradient, width, RIVER_HEIGHT);
  return (
    <Rect x={0} y={0} width={width} height={RIVER_HEIGHT}>
      <RadialGradient
        c={vec(c.x, c.y)}
        r={rx}
        colors={stops}
        positions={positions as number[]}
        origin={vec(c.x, c.y)}
        transform={[{ scaleY: rx > 0 ? ry / rx : 1 }]}
      />
    </Rect>
  );
}

interface RiverProps {
  readonly layers: readonly RiverLayer[];
  /** The river's opacity, then every layer's two stop colours, tweened with the hour. */
  readonly colors: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  readonly width: number;
}

/**
 * The river's reflections: streaks of lantern colour over a wash, cut into fine horizontal lines
 * that slide and stretch with the ripple, then faded out at top and bottom (`mask: transparent,
 * #000 30%, #000 65%, transparent`).
 */
export function River({ layers, colors, time, width }: RiverProps) {
  const opacity = useDerivedValue(() => colors.value[0] ?? 0);
  const ripple = useDerivedValue(() => {
    const p = alternating(time.value, RIPPLE_MS);
    return [
      { translateX: RIPPLE_SLIDE * (2 * p - 1) },
      { translateY: RIVER_HEIGHT / 2 },
      { scaleY: 1 + RIPPLE_STRETCH * p },
      { translateY: -RIVER_HEIGHT / 2 },
    ];
  });
  const box = rect(-RIPPLE_SLIDE, 0, width + 2 * RIPPLE_SLIDE, RIVER_HEIGHT);
  const lines = usePath(LINES_D);
  if (!lines) return null;
  return (
    <Group transform={[{ translateY: RIVER_TOP }]} clip={box}>
      <Group layer={<Paint opacity={opacity} />}>
        <Group transform={ripple}>
          <Group clip={lines}>
            {layers.map((layer, i) => (
              <RiverWash key={i} layer={layer} index={i} colors={colors} width={width} />
            ))}
          </Group>
        </Group>
        <Rect x={0} y={0} width={width} height={RIVER_HEIGHT} blendMode="dstIn">
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, RIVER_HEIGHT)}
            colors={['rgba(0,0,0,0)', '#000000', '#000000', 'rgba(0,0,0,0)']}
            positions={[0, 0.3, 0.65, 1]}
          />
        </Rect>
      </Group>
    </Group>
  );
}

interface FloatProps {
  readonly floater: Floater;
  readonly index: number;
  readonly values: SharedValue<number[]>;
  readonly time: SharedValue<number>;
}

function FloatingLantern({ floater, index, values, time }: FloatProps) {
  const at = index * FLOAT_VALUES;
  const { y, reflection } = floater;
  const transform = useDerivedValue(() => [
    { translateX: FLOAT_FROM + FLOAT_TRAVEL * floatProgress(floater, time.value) },
  ]);
  const body = useDerivedValue(() => colorAt(values.value, at));
  const glow = useDerivedValue(() => colorAt(values.value, at + 4));
  const glowSigma = useDerivedValue(() => values.value[at + 8] ?? 0);
  const glowSpread = useDerivedValue(() => values.value[at + 9] ?? 0);
  const glowX = useDerivedValue(() => -glowSpread.value);
  const glowY = useDerivedValue(() => y - glowSpread.value);
  const glowW = useDerivedValue(() => FLOAT_W + 2 * glowSpread.value);
  const glowH = useDerivedValue(() => FLOAT_H + 2 * glowSpread.value);
  const glowR = useDerivedValue(() => 3 + glowSpread.value);
  const bodyPath = usePath(
    boxPath(0, y, FLOAT_W, FLOAT_H, parseBorderRadius('2px 2px 4px 4px', FLOAT_W, FLOAT_H)),
  );
  const mirror = useDerivedValue(() => colorAt(values.value, at + 10));
  return (
    <Group transform={transform}>
      {/* `0 9px 12px 1px`: the reflection, a fixed distance below. */}
      <RoundedRect
        x={-reflection.spread}
        y={y + reflection.dy - reflection.spread}
        width={FLOAT_W + 2 * reflection.spread}
        height={FLOAT_H + 2 * reflection.spread}
        r={3 + reflection.spread}
        color={mirror}
      >
        <BlurMask blur={reflection.sigma} style="normal" respectCTM />
      </RoundedRect>
      <RoundedRect x={glowX} y={glowY} width={glowW} height={glowH} r={glowR} color={glow}>
        <BlurMask blur={glowSigma} style="normal" respectCTM />
      </RoundedRect>
      {bodyPath && <Path path={bodyPath} color={body} />}
    </Group>
  );
}

interface FloatersProps {
  readonly floaters: readonly Floater[];
  /** Each floater's hour-driven numbers (see `FLOAT_VALUES`). */
  readonly values: SharedValue<number[]>;
  readonly time: SharedValue<number>;
}

/** Six lanterns drifting down the river, lit by the hour. */
export function Floaters({ floaters, values, time }: FloatersProps) {
  return (
    <>
      {floaters.map((floater, i) => (
        <FloatingLantern key={i} floater={floater} index={i} values={values} time={time} />
      ))}
    </>
  );
}
