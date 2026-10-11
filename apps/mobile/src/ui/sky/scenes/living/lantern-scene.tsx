import { Group } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useSceneTween } from '../use-scene-tween';
import type { SceneProps } from '../scene-props';
import { Lanterns } from './lantern-lanterns';
import { bulbValues, lanternModel, lanternValues, wireColor } from './lantern-model';
import { Floaters, River } from './lantern-river';
import { Bulbs, Wires } from './lantern-wires';
import { floaters, floatValues, riverModel, riverValues } from './river-model';

/** The lanterns' layer rises with the scroll at 0.2×. */
const PARALLAX = 0.2;

function RiverLayers({ atm, time, width }: Pick<SceneProps, 'atm' | 'time' | 'width'>) {
  const model = useMemo(() => riverModel(atm), [atm]);
  const colors = useSceneTween(riverValues(atm));
  const drifters = useMemo(() => floaters(atm), [atm]);
  const lit = useSceneTween(floatValues(atm));
  return (
    <>
      {model && <River layers={model.layers} colors={colors} time={time} width={width} />}
      <Floaters floaters={drifters} values={lit} time={time} />
    </>
  );
}

/**
 * Lantern River: the river and its floating lanterns, then two strings of bulbs with five silk
 * lanterns hung from each. The glow ramps up with the hour (16:18 to 18:18). The whole layer
 * rises with the scroll at 0.2×.
 */
export function LanternScene({ atm, time, scrollY, width }: SceneProps) {
  const model = useMemo(() => lanternModel(atm), [atm]);
  const wire = useSceneTween(wireColor(atm));
  const bulbs = useSceneTween(bulbValues(atm));
  const silk = useSceneTween(lanternValues(atm));
  const lift = useDerivedValue(() => [{ translateY: -PARALLAX * scrollY.value }]);
  if (!model) return null;
  return (
    <Group transform={lift}>
      {atm.riverOn === true && <RiverLayers atm={atm} time={time} width={width} />}
      <Wires wires={model.wires} color={wire} />
      <Bulbs bulbs={model.bulbs} values={bulbs} time={time} />
      <Lanterns lanterns={model.lanterns} values={silk} time={time} />
    </Group>
  );
}
