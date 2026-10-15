import { Skia, type SkImage } from '@shopify/react-native-skia';

import { encodeQR } from '@6pm/domain';

import { scanColours as c } from './scan-colours';

/** Pixels per module: large enough that a bank app's photo scanner reads it at a glance. */
const MODULE = 16;
/** The light margin a reader needs around the code, in modules. */
const QUIET = 4;

/**
 * A payment code as a picture to save to Photos, black on white, so a bank app that cannot be
 * handed the payment can read it back from the user's photos. The text is drawn exactly as given.
 */
export function qrImage(payload: string): SkImage {
  const qr = encodeQR(payload);
  const side = (qr.size + QUIET * 2) * MODULE;
  const surface = Skia.Surface.Make(side, side);
  if (!surface) throw new Error('No room to draw the QR code');
  const canvas = surface.getCanvas();
  canvas.drawColor(Skia.Color(c.qrLight));
  const dark = Skia.Paint();
  dark.setColor(Skia.Color(c.qrDark));
  dark.setAntiAlias(false);
  qr.rows.forEach((row, y) =>
    row.forEach((on, x) => {
      if (!on) return;
      const left = (x + QUIET) * MODULE;
      const top = (y + QUIET) * MODULE;
      canvas.drawRect(Skia.XYWHRect(left, top, MODULE, MODULE), dark);
    }),
  );
  surface.flush();
  return surface.makeImageSnapshot();
}
