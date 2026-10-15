import { Skia } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { designAmount, roundToStep, steps } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { useLoop } from './onboarding-motion';
import { DEMO } from './onboarding-palette';

/** Shared by the capture demos: their size, sample data, easing, tap ring and Skia shapes. */

export const W = 280;
export const H = 176;
/**
 * Sample merchants for the pictures: what a scanned code, two receipt emails, an Apple Pay tap
 * and a spoken spend look like.
 */
export const SAMPLE = {
  qrMerchant: 'Bún chả Cô Lan',
  qr: 55_000,
  transfer: 120_000,
  grab: 68_000,
  shopee: 249_000,
  tapMerchant: 'Highlands Coffee',
  tap: 59_000,
  said: 35_000,
};

/**
 * The pictures' amounts in the home currency: a sample in đồng, worth about the same.
 * `said` is the spoken coffee, rounded to a whole step so the words and the spend agree.
 */
export function useSampleMoney() {
  const { t } = useI18n();
  const money = useMoneyFormat();
  const c = money.currency;
  const spoken = Math.max(steps(1, c), roundToStep(designAmount(SAMPLE.said, c), c));
  return {
    full: (dong: number) => money.full(designAmount(dong, c)),
    said: money.full(c.code === 'VND' ? SAMPLE.said : spoken),
    /** The coffee as the words say it: "35k", "35 nghìn", "$2". */
    saidWords: c.code === 'VND' ? t('onboarding.catch.add.amountDong') : money.short(spoken),
  };
}

/**
 * A step of a looping demo: 0 before `from`, 1 after `to`, eased between. For a beat that
 * comes in and later goes, multiply one rising step by one falling (`1 - step(…)`).
 */
export function step(p: number, from: number, to: number): number {
  'worklet';
  if (p <= from) return 0;
  if (p >= to) return 1;
  return inOut((p - from) / (to - from));
}

export const box = { height: H, borderRadius: 20, overflow: 'hidden' } as const;

/** CSS `ease-in-out` on 0–1. */
export function inOut(x: number): number {
  'worklet';
  return x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
}

/** `tapRing`: a warm halo swells 9 pt out and fades, then gathers back, every 1.8 s. */
export function TapRing({
  size,
  radius,
  children,
}: {
  readonly size: number;
  readonly radius: number;
  readonly children: ReactNode;
}) {
  const phase = useLoop(1800, 0, 0.6);
  const halo = useAnimatedStyle(() => {
    const p = phase.value;
    const q = p < 0.6 ? inOut(p / 0.6) : 1 - inOut((p - 0.6) / 0.4);
    const spread = 9 * q;
    return {
      left: -spread,
      top: -spread,
      width: size + 2 * spread,
      height: size + 2 * spread,
      borderRadius: radius + spread,
      // Fade with opacity, not a colour string: a computed alpha can print as 3e-7, which is not
      // a colour Reanimated (or a release build) accepts.
      opacity: 1 - q,
    };
  });
  const [r, g, b] = DEMO.tapRing;
  const ringColour = `rgba(${Math.round((r ?? 0) * 255)},${Math.round((g ?? 0) * 255)},${Math.round((b ?? 0) * 255)},0.8)`;
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ position: 'absolute', backgroundColor: ringColour }, halo]} />
      {children}
    </View>
  );
}

/** Built on first use: Skia is ready by the time a demo draws, not necessarily at import. */
let stripesPath: ReturnType<typeof Skia.Path.Make> | null = null;
export function stripes() {
  if (stripesPath) return stripesPath;
  const path = Skia.Path.Make();
  for (let s = 12; s < (W + H) / Math.SQRT2 + 24; s += 24) {
    const c1 = s * Math.SQRT2;
    const c2 = (s + 12) * Math.SQRT2;
    path.moveTo(c1, 0);
    path.lineTo(c2, 0);
    path.lineTo(c2 - H, H);
    path.lineTo(c1 - H, H);
    path.close();
  }
  stripesPath = path;
  return path;
}

let checkerPath: ReturnType<typeof Skia.Path.Make> | null = null;
export function checker() {
  if (checkerPath) return checkerPath;
  const path = Skia.Path.Make();
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++)
      if ((r + c) % 2 === 1) path.addRect(Skia.XYWHRect(c * 9, r * 9, 9, 9));
  }
  checkerPath = path;
  return path;
}

/** The lock-screen ring: 70% of a turn in white over a faint track. */
let ringPath: ReturnType<typeof Skia.Path.Make> | null = null;
export function ring() {
  if (ringPath) return ringPath;
  const path = Skia.Path.Make();
  path.moveTo(22, 22);
  path.arcToOval(Skia.XYWHRect(0, 0, 44, 44), -90, 252, false);
  path.close();
  ringPath = path;
  return path;
}
