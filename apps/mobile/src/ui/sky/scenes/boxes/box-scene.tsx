import { Group } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { LookId } from '@6pm/theme';

import type { LookSun } from '../../sun-geometry';
import { MOON } from '../../sun-geometry';
import { BoxLayer } from './box-layer';
import { parseBoxes } from './box-model';
import { drawsOwnSun, sunBoxes } from './box-sun';
import type { SceneMotion } from './scene-motion';

interface Common {
  readonly width: number;
  readonly height: number;
  readonly time: SharedValue<number>;
  readonly motion: SceneMotion;
}

/** `atm.back` or `atm.front`: the look's own shapes behind the blooms or in front of the scene. */
export function AtmBoxes({ raw, width, height, time, motion }: Common & { readonly raw: unknown }) {
  const key = useMemo(() => JSON.stringify(raw ?? []), [raw]);
  const boxes = useMemo(
    () => parseBoxes(JSON.parse(key) as unknown, width, height),
    [key, width, height],
  );
  if (boxes.length === 0) return null;
  return <BoxLayer boxes={boxes} time={time} motion={motion} />;
}

/** The sun of a look the shared disc cannot draw, rising with the list's scroll like the disc. */
export function BoxSun({
  look,
  sun,
  lift,
  ...common
}: Common & {
  readonly look: LookId;
  readonly sun: LookSun;
  readonly lift: SharedValue<{ translateY: number }[]>;
}) {
  const raw = useMemo(
    () => (drawsOwnSun(look) ? sunBoxes(sun, common.width) : []),
    [look, sun, common.width],
  );
  if (raw.length === 0) return null;
  return (
    <Group transform={lift}>
      <AtmBoxes raw={raw} {...common} />
    </Group>
  );
}

/** The moon as the look styles it (`moonBg`, `moonSh`): a 26 pt disc at 78% across, 124 pt down. */
export function BoxMoon({
  atm,
  opacity,
  ...common
}: Common & {
  readonly atm: Readonly<Record<string, unknown>>;
  /** The moon's tweened opacity for the hour. */
  readonly opacity: SharedValue<number>;
}) {
  const raw = useMemo(
    () => [
      {
        l: `${MOON.left * 100}%`,
        t: `${MOON.top}px`,
        w: `${MOON.size}px`,
        h: `${MOON.size}px`,
        r: '50%',
        bg: atm.moonBg,
        sh: atm.moonSh,
        op: 1,
      },
    ],
    [atm.moonBg, atm.moonSh],
  );
  return (
    <Group opacity={opacity}>
      <AtmBoxes raw={raw} {...common} />
    </Group>
  );
}
