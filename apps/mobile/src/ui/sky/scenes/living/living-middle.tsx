import type { SceneProps } from '../scene-props';
import { LanternScene } from './lantern-scene';
import { PaperScene } from './paper-scene';

/**
 * The living scenes' own layers, to draw after the light leak and before the
 * vignette: Paper Diorama's hills, Lantern River's river, strings and lanterns. (Long Exposure's
 * trails and skyline are boxes of the atmosphere.) Returns null for every other look.
 */
export function LivingMiddle(props: SceneProps) {
  if (props.look === 'paper') return <PaperScene {...props} />;
  if (props.look === 'lantern') return <LanternScene {...props} />;
  return null;
}
