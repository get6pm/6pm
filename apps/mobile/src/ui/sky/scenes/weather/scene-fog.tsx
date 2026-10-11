import { Blur, Group, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { alternating } from '../../css-keyframes';
import type { Rgba } from '../../css-values';
import { useSceneTween } from '../use-scene-tween';
import { asNumber, parseFog } from './weather-atm';
import { fogShift } from './weather-math';

/** The prototype's two fog banks: both are twice the screen's width, centred on the screen. */
const BANKS = [
  { top: 250, height: 170, centerX: 0.5, sigma: 18, periodMs: 34_000, reverse: false },
  { top: 470, height: 220, centerX: 0.4, sigma: 24, periodMs: 46_000, reverse: true },
] as const;
/** `radial-gradient(50% 50% at …, fog 0%, transparent 70%)`. */
const FADE_OUT = 0.7;

interface BankProps {
  readonly bank: (typeof BANKS)[number];
  readonly fog: Rgba;
  readonly width: number;
  readonly time: SharedValue<number>;
}

function FogBank({ bank, fog, width, time }: BankProps) {
  const { top, height, centerX, sigma, periodMs, reverse } = bank;
  const boxW = 2 * width;
  const left = -0.5 * width;
  const c = vec(left + centerX * boxW, top + height / 2);
  const rx = boxW / 2;
  const clear: Rgba = [fog[0], fog[1], fog[2], 0];
  const drift = useDerivedValue(() => [
    { translateX: fogShift(alternating(time.value, periodMs, reverse), boxW) },
  ]);
  return (
    <Group transform={drift}>
      <Rect x={left} y={top} width={boxW} height={height}>
        <RadialGradient
          c={c}
          r={rx}
          colors={[[...fog], [...clear], [...clear]]}
          positions={[0, FADE_OUT, 1]}
          origin={c}
          transform={[{ scaleY: height / 2 / rx }]}
        />
        <Blur blur={sigma} />
      </Rect>
    </Group>
  );
}

interface FogProps {
  readonly atm: Readonly<Record<string, unknown>>;
  readonly width: number;
  readonly time: SharedValue<number>;
}

/** Fog: two blurred, slowly drifting banks across the middle of the sky. */
export function SceneFog({ atm, width, time }: FogProps) {
  const fog = useMemo(() => parseFog(atm.fog), [atm.fog]);
  const strength = useSceneTween([asNumber(atm.fogOp)]);
  const opacity = useDerivedValue(() => strength.value[0] ?? 0);
  if (!fog) return null;
  return (
    <Group opacity={opacity}>
      {BANKS.map((bank) => (
        <FogBank key={bank.top} bank={bank} fog={fog} width={width} time={time} />
      ))}
    </Group>
  );
}
