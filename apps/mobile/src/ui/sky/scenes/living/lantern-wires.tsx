import { BlurMask, Circle, Group, Path, rect, rrect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { alternating } from '../../css-keyframes';
import { colorAt } from '../../sky-slots';
import type { Bulb, Wire } from './lantern-model';

/** A bulb is a 4 pt disc. */
const BULB_RADIUS = 2;
/** Where each bulb's colour starts in the bulbs' values (after the shared glow). */
const FIRST_BULB = 6;

interface WiresProps {
  readonly wires: readonly Wire[];
  /** The wire's colour (RGBA), tweened with the hour. */
  readonly color: SharedValue<number[]>;
}

/** The two strings: 1 pt lines, each turning about its left end. */
export function Wires({ wires, color }: WiresProps) {
  const path = wires
    .map(
      (w) =>
        `M${w.x} ${w.y}L${(w.x + w.length * Math.cos(w.angle)).toFixed(3)} ${(w.y + w.length * Math.sin(w.angle)).toFixed(3)}`,
    )
    .join('');
  const stroke = useDerivedValue(() => colorAt(color.value, 0));
  return <Path path={path} style="stroke" strokeWidth={1} color={stroke} />;
}

interface BulbProps {
  readonly bulb: Bulb;
  readonly index: number;
  readonly values: SharedValue<number[]>;
  readonly time: SharedValue<number>;
}

function BulbDot({ bulb, index, values, time }: BulbProps) {
  const { x, y, periodMs } = bulb;
  // `@keyframes twinkle`: opacity .35 → 1 and scale .85 → 1.1, eased, back and forth.
  const twinkle = useDerivedValue(() => alternating(time.value, periodMs));
  const transform = useDerivedValue(() => {
    const s = 0.85 + 0.25 * twinkle.value;
    return [
      { translateX: x },
      { translateY: y },
      { scale: s },
      { translateX: -x },
      { translateY: -y },
    ];
  });
  const opacity = useDerivedValue(() => 0.35 + 0.65 * twinkle.value);
  const color = useDerivedValue(() => colorAt(values.value, FIRST_BULB + 4 * index));
  const glow = useDerivedValue(() => colorAt(values.value, 2));
  const sigma = useDerivedValue(() => values.value[0] ?? 0);
  const reach = useDerivedValue(() => BULB_RADIUS + (values.value[1] ?? 0));
  const disc = rrect(
    rect(x - BULB_RADIUS, y - BULB_RADIUS, 2 * BULB_RADIUS, 2 * BULB_RADIUS),
    BULB_RADIUS,
    BULB_RADIUS,
  );
  return (
    <Group transform={transform} opacity={opacity}>
      <Group clip={disc} invertClip>
        <Circle cx={x} cy={y} r={reach} color={glow}>
          <BlurMask blur={sigma} style="normal" respectCTM />
        </Circle>
      </Group>
      <Circle cx={x} cy={y} r={BULB_RADIUS} color={color} />
    </Group>
  );
}

interface BulbsProps {
  readonly bulbs: readonly Bulb[];
  /** Shared glow (σ, spread, colour) then each bulb's colour, tweened with the hour. */
  readonly values: SharedValue<number[]>;
  readonly time: SharedValue<number>;
}

/** Bulbs along the strings, each twinkling on its own period. */
export function Bulbs({ bulbs, values, time }: BulbsProps) {
  return (
    <>
      {bulbs.map((bulb, i) => (
        <BulbDot key={i} bulb={bulb} index={i} values={values} time={time} />
      ))}
    </>
  );
}
