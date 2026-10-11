import type { SceneProps } from '../scene-props';
import { ExpoScene } from './expo-scene';
import { LanternScene } from './lantern-scene';
import { PaperScene } from './paper-scene';

/**
 * The look's own layers for the three premium scenes, to draw after the light leak and before the
 * vignette: Long Exposure's star trails and traffic, Paper Diorama's clouds and hills, Lantern
 * River's river, strings and lanterns. Returns null for every other look.
 */
export function LivingMiddle(props: SceneProps) {
  if (props.look === 'expo') return <ExpoScene {...props} />;
  if (props.look === 'paper') return <PaperScene {...props} />;
  if (props.look === 'lantern') return <LanternScene {...props} />;
  return null;
}
