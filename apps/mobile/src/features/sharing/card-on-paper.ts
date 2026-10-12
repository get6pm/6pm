import { BlendMode, FilterMode, MipmapMode, Skia, type SkImage } from '@shopify/react-native-skia';
import { PixelRatio } from 'react-native';

import { drawImage } from './capture-view';

/** The look the card has on screen: tilted, lifted by its shadow, on the grainy page colour. */
export interface CardOnPaper {
  /** The page colour behind the card. */
  readonly paper: string;
  /** Degrees, as the card's CSS `rotate`. */
  readonly rotate: number;
  /** The card's CSS `box-shadow`, outer and single. */
  readonly shadow: { readonly y: number; readonly blur: number; readonly color: string };
  /** Points of page around the card's own box. */
  readonly margin: { readonly side: number; readonly top: number; readonly bottom: number };
}

/** The zine page's tooth, as `ZineGrain` draws it: fractal noise .85, two octaves, 30% multiply. */
const GRAIN = { freq: 0.85, octaves: 2, opacity: 0.3 };

/**
 * Lays a captured card back onto its page the way the screen shows it, so the shared image keeps
 * the tilt, the shadow and the paper grain that a capture of the card alone would lose.
 */
export function cardOnPaper(card: SkImage, look: CardOnPaper): SkImage {
  const { margin, shadow } = look;
  const density = PixelRatio.get();
  const cardW = card.width() / density;
  const cardH = card.height() / density;
  const width = cardW + margin.side * 2;
  const height = cardH + margin.top + margin.bottom;
  return drawImage(width, height, (canvas, scale) => {
    canvas.scale(scale, scale);
    canvas.drawColor(Skia.Color(look.paper));

    const grain = Skia.Paint();
    grain.setShader(Skia.Shader.MakeFractalNoise(GRAIN.freq, GRAIN.freq, GRAIN.octaves, 0, 0, 0));
    grain.setColorFilter(Skia.ColorFilter.MakeLinearToSRGBGamma());
    const grainLayer = Skia.Paint();
    grainLayer.setAlphaf(GRAIN.opacity);
    grainLayer.setBlendMode(BlendMode.Multiply);
    canvas.saveLayer(grainLayer);
    canvas.drawRect(Skia.XYWHRect(0, 0, width, height), grain);
    canvas.restore();

    const x = margin.side;
    const y = margin.top;
    canvas.save();
    canvas.rotate(look.rotate, x + cardW / 2, y + cardH / 2);
    const lift = Skia.Paint();
    // A CSS blur radius is twice the Gaussian sigma.
    lift.setImageFilter(
      Skia.ImageFilter.MakeDropShadow(
        0,
        shadow.y,
        shadow.blur / 2,
        shadow.blur / 2,
        Skia.Color(shadow.color),
      ),
    );
    canvas.saveLayer(lift);
    canvas.drawImageRectOptions(
      card,
      Skia.XYWHRect(0, 0, card.width(), card.height()),
      Skia.XYWHRect(x, y, cardW, cardH),
      FilterMode.Linear,
      MipmapMode.None,
    );
    canvas.restore();
    canvas.restore();
  });
}
