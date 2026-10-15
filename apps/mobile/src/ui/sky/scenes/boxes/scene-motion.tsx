import { useEffect } from 'react';
import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * The phone's motion as the living scenes read it (the prototype's `--tx`, `--ty`, `--pend`,
 * `--exp`): tilt left–right and front–back (−1…1), a pendulum's swing in degrees' units, and the
 * exposure, which grows towards 1 while the phone is held still.
 */
export interface SceneMotion {
  readonly tx: SharedValue<number>;
  readonly ty: SharedValue<number>;
  readonly pend: SharedValue<number>;
  readonly exp: SharedValue<number>;
}

export function useSceneMotionValues(): SceneMotion {
  return {
    tx: useSharedValue(0),
    ty: useSharedValue(0),
    pend: useSharedValue(0),
    exp: useSharedValue(1),
  };
}

const clamp1 = (v: number) => {
  'worklet';
  return Math.max(-1, Math.min(1, v));
};

/**
 * Drives `motion` from the phone's gravity, one step per sky frame, as the prototype's `tick()`
 * does from `deviceorientation`: the tilt eases in at 9% a frame, stillness builds over six
 * seconds and any movement spends it, the exposure follows stillness, and the pendulum swings
 * towards the tilt and settles. Mount it only while a scene with "sense" is on.
 */
export function SceneMotionDriver({
  motion,
  time,
}: {
  readonly motion: SceneMotion;
  readonly time: SharedValue<number>;
}) {
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const state = useSharedValue({ cx: 0, cy: 0, pendV: 0, still: 1 });
  useAnimatedReaction(
    () => time.value,
    (now, before) => {
      if (before === null || now === before) return;
      const g = gravity.sensor.value;
      const n = Math.hypot(g.x, g.y, g.z) || 1;
      // Degrees, as the browser reports them: gamma tilts left–right, beta front–back.
      const gamma = (Math.asin(Math.max(-1, Math.min(1, g.x / n))) * 180) / Math.PI;
      const beta = (Math.atan2(-g.y, -g.z) * 180) / Math.PI;
      const tx = clamp1(gamma / 28);
      const ty = clamp1((beta - 45) / 28);
      const s = { ...state.value };
      const dx = tx - s.cx;
      const dy = ty - s.cy;
      s.cx += dx * 0.09;
      s.cy += dy * 0.09;
      const moved = Math.abs(dx) + Math.abs(dy);
      s.still =
        moved > 0.012 ? Math.max(0, s.still - moved * 0.08) : Math.min(1, s.still + 1 / 360);
      motion.exp.value += (0.12 + 0.88 * s.still - motion.exp.value) * 0.12;
      s.pendV += (-s.cx * 22 - motion.pend.value) * 0.016;
      s.pendV *= 0.965;
      motion.pend.value += s.pendV;
      motion.tx.value = s.cx;
      motion.ty.value = s.cy;
      state.value = s;
    },
  );
  useEffect(
    () => () => {
      motion.tx.value = 0;
      motion.ty.value = 0;
      motion.pend.value = 0;
      motion.exp.value = 1;
    },
    [motion],
  );
  return null;
}
