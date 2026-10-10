import type { SharedValue } from 'react-native-reanimated';

import type { SkyLayout } from './sky-frame';

/** What every layer of the sky draws from. */
export interface SkyLayerProps {
  /** The tweened slot values (see `SLOT`). */
  readonly frame: SharedValue<number[]>;
  readonly layout: SkyLayout;
  readonly width: number;
  readonly height: number;
  /** Milliseconds since the sky appeared (held at 0 under Reduce Motion). */
  readonly time: SharedValue<number>;
  /** The Today list's scroll offset, for the prototype's parallax (`--sy`). */
  readonly scrollY: SharedValue<number>;
}
