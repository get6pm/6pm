import { useMemo } from 'react';

import { expoModel } from './expo-model';
import { ExpoTrails } from './expo-trails';
import { ExpoTraffic } from './expo-traffic';
import { useSceneTween } from '../use-scene-tween';
import type { SceneProps } from '../scene-props';

const NONE = new Array<number>(32).fill(0);

/** Long Exposure: star trails turning about the pole star, then the traffic's light trails. */
export function ExpoScene({ atm, time, scrollY, width, height }: SceneProps) {
  const model = useMemo(() => expoModel(atm), [atm]);
  const colors = useSceneTween(model?.colors ?? NONE);
  if (!model) return null;
  return (
    <>
      {model.stars && <ExpoTrails model={model} time={time} width={width} height={height} />}
      {model.traffic && (
        <ExpoTraffic model={model} colors={colors} time={time} scrollY={scrollY} width={width} />
      )}
    </>
  );
}
