import { useDerivedValue } from 'react-native-reanimated';

import type { SceneProps } from '../scene-props';
import { useSceneTween } from '../use-scene-tween';
import { Glints } from './surface-glints';
import { HoloFoil } from './surface-holo';
import { secondsToMs } from './surface-motion';
import { Sheen } from './surface-sheen';
import { numberOf, textOf } from './surface-css';

/** `holoSpeed` is `22s`, or `7s` with "Fast shimmer". */
const SLOW_MS = 22_000;

function Layers({ scene }: { scene: SceneProps }) {
  const { atm, width, height, time, scrollY } = scene;
  const strength = useSceneTween([numberOf(atm, 'holoOp'), numberOf(atm, 'sheenOp')]);
  const holoOp = useDerivedValue(() => strength.value[0] ?? 0);
  const sheenOp = useDerivedValue(() => strength.value[1] ?? 0);
  return (
    <>
      {atm.holoOn === true && (
        <HoloFoil
          opacity={holoOp}
          periodMs={secondsToMs(textOf(atm, 'holoSpeed'), SLOW_MS)}
          width={width}
          height={height}
          time={time}
        />
      )}
      {atm.sheenOn === true && (
        <Sheen
          css={textOf(atm, 'sheen')}
          opacity={sheenOp}
          width={width}
          height={height}
          time={time}
        />
      )}
      <Glints
        glints={atm.glints}
        strength={numberOf(atm, 'glintsOp')}
        width={width}
        time={time}
        scrollY={scrollY}
      />
    </>
  );
}

/**
 * The surface looks' layers between the light leak and the vignette, in the prototype's order:
 * Holo Foil's turning rainbow wash (overlay), the lacquer or foil sheen sweeping across (screen),
 * then the gold-leaf flakes or sparkles (normal). Mount it after `SkyLeak` and before the vignette.
 * Returns null for a look with none of these (or with the effects switched off).
 */
export function SurfaceMiddle(scene: SceneProps) {
  const { atm } = scene;
  const glints = Array.isArray(atm.glints) && atm.glints.length > 0;
  if (atm.holoOn !== true && atm.sheenOn !== true && !glints) return null;
  return <Layers scene={scene} />;
}
