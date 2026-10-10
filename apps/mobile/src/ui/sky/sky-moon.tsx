import {
  BlurMask,
  Circle,
  Group,
  Path,
  PathOp,
  rect,
  rrect,
  Skia,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { CLEAR, parseBoxShadows, parseColor, type Rgba } from './css-values';
import type { SkyLayerProps } from './sky-layer-props';
import { SLOT } from './sky-slots';
import { MOON } from './sun-geometry';

const DISC = parseColor(MOON.color) ?? CLEAR;
const GLOW = parseBoxShadows(MOON.glow)[0];
const SHADE = parseBoxShadows(MOON.shade)[0];

/** The inset shadow painted over the opaque disc, as one opaque colour (source-over). */
const SHADED: Rgba = (() => {
  const s = SHADE?.color ?? CLEAR;
  const a = s[3];
  return [
    DISC[0] * (1 - a) + s[0] * a,
    DISC[1] * (1 - a) + s[1] * a,
    DISC[2] * (1 - a) + s[2] * a,
    1,
  ];
})();

/**
 * The moon after 19:00: a 26 pt disc with a faint 50 pt glow and a crescent of shade on its lower
 * right (an inset shadow offset −7, −3). It does not move with the scroll.
 */
export function SkyMoon({ frame, width }: Pick<SkyLayerProps, 'frame' | 'width'>) {
  const r = MOON.size / 2;
  const cx = MOON.left * width + r;
  const cy = MOON.top + r;
  const opacity = useDerivedValue(() => frame.value[SLOT.moonOp] ?? 0);
  // The lit part and the crescent are drawn as two disjoint shapes, so fading the moon never shows
  // one through the other.
  const { disc, lit, crescent } = useMemo(() => {
    const box = rect(cx - r, cy - r, 2 * r, 2 * r);
    const discPath = Skia.Path.Make();
    discPath.addOval(box);
    const shifted = Skia.Path.Make();
    shifted.addOval(rect(box.x + (SHADE?.x ?? 0), box.y + (SHADE?.y ?? 0), 2 * r, 2 * r));
    return {
      disc: rrect(box, r, r),
      lit: Skia.Path.MakeFromOp(discPath, shifted, PathOp.Intersect) ?? discPath,
      crescent: Skia.Path.MakeFromOp(discPath, shifted, PathOp.Difference) ?? Skia.Path.Make(),
    };
  }, [cx, cy, r]);
  const glowR = r + (GLOW?.spread ?? 0);
  const glowColor = [...(GLOW?.color ?? CLEAR)];
  return (
    <Group opacity={opacity}>
      <Group clip={disc} invertClip>
        <Circle cx={cx} cy={cy} r={glowR} color={glowColor}>
          <BlurMask blur={(GLOW?.blur ?? 0) / 2} style="normal" respectCTM />
        </Circle>
      </Group>
      <Path path={lit} color={[...DISC]} />
      <Path path={crescent} color={[...SHADED]} />
    </Group>
  );
}
