import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';

import { drawCompanion } from '../../apps/mobile/src/ui/companion/draw-companion';
import type { CompanionForm } from '../../apps/mobile/src/ui/companion/companion-mood';
import { makeFrame } from '../../apps/mobile/src/ui/companion/make-frame';

/** Where each companion stands in its icon: its drawing size and where its body's centre falls. */
export interface Placement {
  readonly size: number;
  readonly centreY: number;
}

const NO_FONTS = {
  large: null as never,
  small: null as never,
};

/**
 * One companion, content with its eyes closed (the nod's still moment), drawn by the app's own
 * code on a transparent `edge`² square. Returns straight RGBA bytes.
 */
export function companionPixels(form: CompanionForm, edge: number, at: Placement): Uint8Array {
  const surface = Skia.Surface.MakeOffscreen(edge, edge) ?? Skia.Surface.Make(edge, edge);
  if (!surface) throw new Error('No surface');
  const canvas = surface.getCanvas();
  const frame = makeFrame({
    s: at.size,
    el: 0,
    since: 99,
    sinceF: 99,
    mood: 'nod',
    form,
    seed: 1,
  });
  canvas.translate(edge / 2 - frame.cx, at.centreY - frame.cy);
  drawCompanion(canvas, frame, NO_FONTS);
  surface.flush();
  const pixels = surface.makeImageSnapshot().readPixels(0, 0, {
    width: edge,
    height: edge,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!(pixels instanceof Uint8Array)) throw new Error('No pixels');
  return pixels;
}
