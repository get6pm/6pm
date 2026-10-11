import {
  BlurMask,
  Group,
  LinearGradient,
  Paint,
  Rect,
  RoundedRect,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { colorAt } from '../../sky-slots';
import {
  carOffset,
  carProgress,
  EXPO_COLOR,
  TRAFFIC_HEIGHT,
  type CarSpec,
  type ExpoModel,
} from './expo-model';

/** The traffic box runs from 20% beyond each side of the sky, 356 pt down, tilted −7°. */
const TOP = 356;
const TILT = (-7 * Math.PI) / 180;
const PARALLAX = 0.3;
/** Every car carries `box-shadow: 0 0 6px`: a Gaussian of σ 3. */
const GLOW_SIGMA = 3;
/** Lanes carry `filter: blur(.8px)`. */
const LANE_SIGMA = 0.8;

interface CarProps {
  readonly car: CarSpec;
  readonly colors: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  readonly left: number;
}

function Car({ car, colors, time, left }: CarProps) {
  const { direction, width, height } = car;
  const offset = direction === 1 ? EXPO_COLOR.rightHead : EXPO_COLOR.leftHead;
  const tipOffset = direction === 1 ? EXPO_COLOR.rightTip : EXPO_COLOR.leftTip;
  const transform = useDerivedValue(() => [
    { translateX: left + carOffset(direction, carProgress(car, time.value)) },
  ]);
  const head = useDerivedValue(() => colorAt(colors.value, offset));
  const tail = useDerivedValue(() => colorAt(colors.value, offset, 0));
  const tip = useDerivedValue(() => colorAt(colors.value, tipOffset));
  const r = height / 2;
  const y = TOP + car.y;
  const capsule = rrect(rect(0, y, width, height), r, r);
  const gradient = useDerivedValue(() => [tail.value, head.value, tip.value]);
  // A car's gradient runs from its tail (clear) to its light at 78%, then to the bright tip.
  const [from, to] = direction === 1 ? [vec(0, 0), vec(width, 0)] : [vec(width, 0), vec(0, 0)];
  return (
    <Group transform={transform}>
      <Group clip={capsule} invertClip>
        <RoundedRect x={0} y={y} width={width} height={height} r={r} color={head}>
          <BlurMask blur={GLOW_SIGMA} style="normal" respectCTM />
        </RoundedRect>
      </Group>
      <RoundedRect x={0} y={y} width={width} height={height} r={r}>
        <LinearGradient start={from} end={to} colors={gradient} positions={[0, 0.78, 1]} />
      </RoundedRect>
    </Group>
  );
}

interface LaneProps {
  readonly index: number;
  readonly from: number;
  readonly to: number;
  readonly colors: SharedValue<number[]>;
  readonly left: number;
  readonly span: number;
}

function Lane({ index, from, to, colors, left, span }: LaneProps) {
  const color = useDerivedValue(() => colorAt(colors.value, EXPO_COLOR.lane + 4 * index));
  const y = TOP + from * TRAFFIC_HEIGHT;
  return (
    <Rect x={left} y={y} width={span} height={(to - from) * TRAFFIC_HEIGHT} color={color}>
      <BlurMask blur={LANE_SIGMA} style="normal" respectCTM />
    </Rect>
  );
}

interface Props {
  readonly model: ExpoModel;
  readonly colors: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  readonly scrollY: SharedValue<number>;
  readonly width: number;
}

/**
 * Four lane glints and twelve light trails, composited in one layer and screened over the sky.
 * The layer is 140% as wide as the sky, tilted −7° about its centre and rising at 0.3× the scroll
 * along its own tilted axis. Cars cross it on `carR`/`carL`, linear and endless.
 */
export function ExpoTraffic({ model, colors, time, scrollY, width }: Props) {
  const left = -0.2 * width;
  const span = 1.4 * width;
  const cx = left + span / 2;
  const cy = TOP + TRAFFIC_HEIGHT / 2;
  const transform = useDerivedValue(() => [
    { translateX: cx },
    { translateY: cy },
    { rotate: TILT },
    { translateY: -PARALLAX * scrollY.value },
    { translateX: -cx },
    { translateY: -cy },
  ]);
  const box = rect(left, TOP, span, TRAFFIC_HEIGHT);
  return (
    <Group transform={transform} clip={box}>
      <Group layer={<Paint blendMode="screen" opacity={model.trafficOpacity} />}>
        {model.lanes.map((line, i) => (
          <Lane
            key={line.from}
            index={i}
            from={line.from}
            to={line.to}
            colors={colors}
            left={left}
            span={span}
          />
        ))}
        {model.cars.map((car, i) => (
          <Car key={i} car={car} colors={colors} time={time} left={left} />
        ))}
      </Group>
    </Group>
  );
}
