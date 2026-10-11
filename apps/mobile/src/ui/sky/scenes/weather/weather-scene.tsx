import type { SceneProps } from '../scene-props';
import { SceneDrops } from './scene-drops';
import { SceneFlash } from './scene-flash';
import { SceneFog } from './scene-fog';
import { SceneRain } from './scene-rain';

/**
 * Rain, fog and lightning, in the prototype's order. Draw after the light leak and before the
 * vignette. Each layer exists only while the look's atmosphere switches it on (the prototype
 * removes it outright when it goes off), so a look with no weather draws nothing.
 */
export function WeatherMiddle({ atm, width, height, time }: SceneProps) {
  const rain = atm.rainOn === true;
  const fog = atm.fogOn === true;
  const flash = atm.flashOn === true;
  if (!rain && !fog && !flash) return null;
  return (
    <>
      {rain && <SceneRain atm={atm} width={width} height={height} time={time} />}
      {fog && <SceneFog atm={atm} width={width} time={time} />}
      {flash && <SceneFlash width={width} height={height} time={time} />}
    </>
  );
}

/** Drops on the glass. Draw above everything else in the sky, after the grain. */
export function WeatherTop({ atm, width, time }: SceneProps) {
  if (atm.dropsOn !== true) return null;
  return <SceneDrops atm={atm} width={width} time={time} />;
}
