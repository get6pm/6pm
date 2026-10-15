import type { SharedValue } from 'react-native-reanimated';

import type { LookConfig, LookId, Palette } from '@6pm/theme';

import type { SceneMotion } from './boxes/scene-motion';

/**
 * What a look's own layers draw from (rain, fog, CRT, holo foil, lanterns, hills, star trails…).
 * They sit outside the shared slot array: each scene reads the prototype's atmosphere for this
 * hour and tweens its own few numbers with `useSceneTween`.
 */
export interface SceneProps {
  readonly look: LookId;
  readonly config: LookConfig;
  readonly hour: number;
  readonly serious: boolean;
  /** `atmosphereFor(...)` for this hour: the prototype's `atm()` object (rainOn, fogOp, drops…). */
  readonly atm: Readonly<Record<string, unknown>>;
  readonly palette: Palette;
  readonly width: number;
  readonly height: number;
  /** Milliseconds since the sky appeared; held at 0 under Reduce Motion. */
  readonly time: SharedValue<number>;
  /** The Today list's scroll offset, for parallax. */
  readonly scrollY: SharedValue<number>;
  /** The phone's tilt, swing and stillness, for the living scenes that sense it. */
  readonly motion: SceneMotion;
}

/**
 * Whether the sun is showing, as a shared value the UI thread switches (a tab change), with the
 * state it starts in so the first frame is right without reading the value back.
 */
export interface SunFlag {
  readonly flag: SharedValue<boolean>;
  readonly initial: boolean;
}
