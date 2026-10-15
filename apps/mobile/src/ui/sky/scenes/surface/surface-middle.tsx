import { useDerivedValue } from 'react-native-reanimated';

import type { SceneProps } from '../scene-props';
import { useSceneTween } from '../use-scene-tween';
import { Sheen } from './surface-sheen';
import { numberOf, textOf } from './surface-css';

function Layers({ scene }: { scene: SceneProps }) {
  const { atm, width, height, time } = scene;
  const strength = useSceneTween([numberOf(atm, 'sheenOp')]);
  const sheenOp = useDerivedValue(() => strength.value[0] ?? 0);
  return (
    <Sheen css={textOf(atm, 'sheen')} opacity={sheenOp} width={width} height={height} time={time} />
  );
}

/**
 * Light sliding across the surface (Sơn Mài's lacquer, Bát Tràng's glaze), between the light leak
 * and the scenes, as the prototype orders it. Returns null when the look has no sheen or it is off.
 */
export function SurfaceMiddle(scene: SceneProps) {
  if (scene.atm.sheenOn !== true) return null;
  return <Layers scene={scene} />;
}
