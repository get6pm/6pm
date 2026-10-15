import { BlurMask, Group, Path, PathOp, Skia, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { parseColor } from '../../css-values';
import { BoxLayer } from '../boxes/box-layer';
import { parseBoxes, type Box } from '../boxes/box-model';
import { roundedBox } from '../boxes/box-path';
import type { SceneMotion } from '../boxes/scene-motion';
import type { SceneProps } from '../scene-props';

/** Points past a layer's outline that its blurred shadow still reaches (about 4σ of 7). */
const REACH = 30;

interface Hill {
  readonly boxes: readonly Box[];
  /** Scroll factor: the layer moves `f × scrollY`. */
  readonly f: number;
  /** Points per unit of tilt, x and y. */
  readonly dx: number;
  readonly dy: number;
  readonly shadow: { readonly sigma: number; readonly color: number[] } | null;
  readonly silhouette: SkPath | null;
}

/**
 * `drop-shadow(calc(var(--tx, 0) * -6px) calc(-4px - var(--ty, 0) * 2px) 7px rgba(…))`: the blur
 * and colour (a filter's drop-shadow takes its blur as the deviation itself, as Chromium draws it).
 */
function dropShadow(css: string) {
  const m = /(\d+(?:\.\d+)?)px (rgba?\([^)]*\))\)$/.exec(css.trim());
  const color = m?.[2] ? parseColor(m[2]) : null;
  return m?.[1] && color ? { sigma: Number(m[1]), color: [...color] } : null;
}

/**
 * The silhouette a layer's shadow is cast from: the union of its pieces (overlapping hills shade
 * once), trimmed to the band the shadow can show in above the ground.
 */
function silhouette(boxes: readonly Box[], width: number): SkPath | null {
  let union: SkPath | null = null;
  for (const b of boxes) {
    const piece = roundedBox(b.x, b.y, b.w, b.h, b.radii);
    union = union ? Skia.Path.MakeFromOp(union, piece, PathOp.Union) : piece;
  }
  const ground = boxes.at(-1);
  if (!union || !ground) return null;
  const top = Math.min(...boxes.map((b) => b.y)) - REACH;
  const band = Skia.Path.Make();
  band.addRect(Skia.XYWHRect(-REACH, top, width + 2 * REACH, ground.y + REACH - top));
  return Skia.Path.MakeFromOp(union, band, PathOp.Intersect);
}

function HillLayer({
  hill,
  scrollY,
  time,
  motion,
}: {
  readonly hill: Hill;
  readonly scrollY: SharedValue<number>;
  readonly time: SharedValue<number>;
  readonly motion: SceneMotion;
}) {
  const place = useDerivedValue(() => [
    { translateX: hill.dx * motion.tx.value },
    { translateY: hill.dy * motion.ty.value + hill.f * scrollY.value },
  ]);
  // The shadow falls up and away from the tilt: x −6 pt and y −4 − 2 pt per unit.
  const cast = useDerivedValue(() => [
    { translateX: -6 * motion.tx.value },
    { translateY: -4 - 2 * motion.ty.value },
  ]);
  return (
    <Group transform={place}>
      {hill.silhouette && hill.shadow ? (
        <Group transform={cast}>
          <Path path={hill.silhouette} color={hill.shadow.color}>
            <BlurMask blur={hill.shadow.sigma} style="normal" respectCTM />
          </Path>
        </Group>
      ) : null}
      <BoxLayer boxes={hill.boxes} time={time} motion={motion} />
    </Group>
  );
}

/** Paper Diorama: layers of cut-paper hills from the farthest to the ground in front. */
export function PaperScene({ atm, time, scrollY, width, height, motion }: SceneProps) {
  const key = useMemo(() => JSON.stringify(atm.hills ?? []), [atm.hills]);
  const hills = useMemo((): Hill[] => {
    const raw = JSON.parse(key) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.map((h: Record<string, unknown>) => {
      const boxes = parseBoxes(
        (Array.isArray(h.items) ? h.items : []).map((it: Record<string, unknown>) => ({
          ...it,
          op: 1,
        })),
        width,
        height,
      );
      return {
        boxes,
        f: parseFloat(String(h.f)) || 0,
        dx: parseFloat(String(h.dx)) || 0,
        dy: parseFloat(String(h.dy)) || 0,
        shadow: dropShadow(typeof h.sh === 'string' ? h.sh : ''),
        silhouette: silhouette(boxes, width),
      };
    });
  }, [key, width, height]);
  if (atm.paperOn !== true) return null;
  return (
    <>
      {hills.map((hill, i) => (
        <HillLayer key={i} hill={hill} scrollY={scrollY} time={time} motion={motion} />
      ))}
    </>
  );
}
