import { Group, Image } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { PixelRatio } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useSceneTween } from '../use-scene-tween';
import { bakeDrop, DROP_PADDING } from './drop-bake';
import { asNumber, parseDrops, type GlassDrop } from './weather-atm';
import { dropFrame } from './weather-math';

function Drop({
  drop,
  image,
  width,
  time,
  strength,
}: {
  drop: GlassDrop;
  image: NonNullable<ReturnType<typeof bakeDrop>>;
  width: number;
  time: SharedValue<number>;
  strength: SharedValue<number>;
}) {
  const { x, y, width: w, height: h, periodMs, delayMs } = drop;
  const left = x * width;
  const slide = useDerivedValue(() => {
    const f = dropFrame(time.value, periodMs, delayMs);
    return [{ translateX: left }, { translateY: y + f.y }];
  });
  const fade = useDerivedValue(
    () => dropFrame(time.value, periodMs, delayMs).opacity * strength.value,
  );
  return (
    <Group transform={slide}>
      <Image
        image={image}
        x={-DROP_PADDING}
        y={-DROP_PADDING}
        width={w + 2 * DROP_PADDING}
        height={h + 2 * DROP_PADDING}
        fit="fill"
        opacity={fade}
      />
    </Group>
  );
}

interface DropsProps {
  readonly atm: Readonly<Record<string, unknown>>;
  readonly width: number;
  readonly time: SharedValue<number>;
}

/**
 * Drops sliding down the glass: each fades in, slides 260 pt on its own period and fades out. Each
 * drop is painted once into a small image and the image slides, so a frame draws a few quads in
 * place of a blur and a clip per drop.
 */
export function SceneDrops({ atm, width, time }: DropsProps) {
  const drops = useMemo(() => parseDrops(atm.drops), [atm.drops]);
  const scale = PixelRatio.get();
  const baked = useMemo(
    () =>
      drops.flatMap((drop) => {
        const image = bakeDrop(drop.width, drop.height, scale);
        return image ? [{ drop, image }] : [];
      }),
    [drops, scale],
  );
  const tween = useSceneTween([asNumber(atm.dropsOp)]);
  const strength = useDerivedValue(() => tween.value[0] ?? 0);
  return (
    <>
      {baked.map(({ drop, image }, i) => (
        <Drop key={i} drop={drop} image={image} width={width} time={time} strength={strength} />
      ))}
    </>
  );
}
