import { Canvas, Image, type SkImage } from '@shopify/react-native-skia';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import type { LookConfig, LookId } from '@6pm/theme';

import type { LookCopy } from './look-copy';
import { useLookPreview } from './look-preview';
import { LookSkyPreview, PreviewFace } from './look-sky-preview';
import { CardCell, type CardRect } from './shop-card';

const CARD_RADIUS = 32;

/**
 * A look's card flying between the shop and the page above the try-on, drawn over everything.
 * It is the card's own picture: a still of the card's sky (the live sky if no still could be
 * taken) with the date, the clock and the sign written on it, and its cell. Drawn at the
 * screen's size and shrunk by the card's width, it matches the card exactly at `progress` 0; as
 * `progress` goes to 1 the cut opens to `to` and the picture grows with it, and the cell fades in
 * the first third. Every frame is a style on the UI thread; nothing is redrawn.
 */
export function CardFlight({
  look,
  hour,
  config,
  cta,
  copy,
  card,
  to,
  image,
  progress,
  opacity,
  onReady,
}: {
  readonly look: LookId;
  readonly hour: number;
  readonly config: Partial<LookConfig> | undefined;
  readonly cta: string;
  readonly copy: LookCopy;
  /** Where the card is on the screen. */
  readonly card: CardRect;
  /** Where the picture lands: the page above the try-on. */
  readonly to: CardRect;
  readonly image: SkImage | null;
  readonly progress: SharedValue<number>;
  readonly opacity: SharedValue<number>;
  /** Laid out: the flight can start. */
  readonly onReady: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const { palette } = useLookPreview(look, hour, config);
  // The still covers the card; at the screen's size that is this tall.
  const stillHeight = (card.height * width) / card.width;

  const clip = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: opacity.get(),
      left: card.x + (to.x - card.x) * p,
      top: card.y + (to.y - card.y) * p,
      width: card.width + (to.width - card.width) * p,
      height: card.height + (to.height - card.height) * p,
      borderRadius: CARD_RADIUS * (1 - p),
    };
  });
  const picture = useAnimatedStyle(() => {
    const p = progress.get();
    return { transform: [{ scale: (card.width + (to.width - card.width) * p) / width }] };
  });
  // The date and clock leave over the last stretch, so the sky alone meets the page's own.
  const face = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.55, 0.95], [1, 0], Extrapolation.CLAMP),
  }));
  const cell = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.3], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onReady}
      style={[{ position: 'absolute', overflow: 'hidden' }, clip]}
    >
      <Animated.View
        style={[{ width, height, transformOrigin: '0 0', backgroundImage: palette.sky }, picture]}
      >
        {image ? (
          <>
            <Canvas style={{ width, height: stillHeight }}>
              <Image image={image} x={0} y={0} width={width} height={stillHeight} fit="fill" />
            </Canvas>
            <Animated.View style={[StyleSheet.absoluteFill, face]}>
              <PreviewFace look={look} hour={hour} config={config} sign />
            </Animated.View>
          </>
        ) : (
          <LookSkyPreview
            look={look}
            hour={hour}
            config={config}
            width={width}
            height={height}
            running={false}
          />
        )}
      </Animated.View>
      <Animated.View style={[styles.cell, { width: card.width, height: card.height }, cell]}>
        <CardCell look={look} hour={hour} config={config} cta={cta} copy={copy} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: { position: 'absolute', left: 0, top: 0 },
});
