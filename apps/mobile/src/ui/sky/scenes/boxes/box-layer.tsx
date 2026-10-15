import {
  Blend,
  Blur,
  BlurMask,
  ColorShader,
  Group,
  Paint,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import type { BoxShadow, Rgba } from '../../css-values';
import { gradientShader, layerShader } from './box-fill';
import type { Box } from './box-model';
import { animatedOpacity, animatedTransform } from './box-motion';
import { grownRadii, roundedBox } from './box-path';
import type { SceneMotion } from './scene-motion';

const rgba = (c: Rgba, k = 1): number[] => [c[0], c[1], c[2], c[3] * k];
const deg = (d: number) => (d * Math.PI) / 180;

/** An outer box-shadow: the box grown by its spread, offset and blurred, never under the box. */
function OuterShadow({ box, s }: { readonly box: Box; readonly s: BoxShadow }) {
  const path = useMemo(
    () =>
      roundedBox(
        s.x - s.spread,
        s.y - s.spread,
        box.w + 2 * s.spread,
        box.h + 2 * s.spread,
        grownRadii(box.radii, s.spread),
      ),
    [box, s],
  );
  return (
    <Path path={path} color={rgba(s.color)}>
      {s.blur > 0 ? <BlurMask blur={s.blur / 2} style="normal" respectCTM /> : null}
    </Path>
  );
}

/** An inset box-shadow: everything outside the shrunk, offset box, blurred, inside the box. */
function InsetShadow({ box, s }: { readonly box: Box; readonly s: BoxShadow }) {
  const path = useMemo(() => {
    const pad = s.blur * 2 + Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.spread) + 4;
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(-pad, -pad, box.w + 2 * pad, box.h + 2 * pad));
    p.addPath(
      roundedBox(
        s.x + s.spread,
        s.y + s.spread,
        box.w - 2 * s.spread,
        box.h - 2 * s.spread,
        grownRadii(box.radii, -s.spread),
      ),
    );
    p.setFillType(1); // even-odd: the frame around the hole
    return p;
  }, [box, s]);
  return (
    <Path path={path} color={rgba(s.color)}>
      {s.blur > 0 ? <BlurMask blur={s.blur / 2} style="normal" respectCTM /> : null}
    </Path>
  );
}

function BoxView({
  box,
  time,
  motion,
}: {
  readonly box: Box;
  readonly time: SharedValue<number>;
  readonly motion: SceneMotion;
}) {
  const shape = useMemo(() => roundedBox(0, 0, box.w, box.h, box.radii), [box]);
  const outer = box.shadows.filter((s) => !s.inset).reverse();
  const inset = box.shadows.filter((s) => s.inset).reverse();
  const [ox, oy] = box.origin;
  const { sense, animation } = box;
  const moving = sense.tx !== 0 || sense.ty !== 0 || sense.pendDeg !== 0 || animation !== null;

  const transform = useDerivedValue(() => {
    const anim = animatedTransform(animation, time.value);
    const turn =
      box.rotateDeg * (anim ? 0 : 1) + (anim?.rotateDeg ?? 0) + sense.pendDeg * motion.pend.value;
    return [
      { translateX: box.x + sense.tx * motion.tx.value + ox },
      { translateY: box.y + sense.ty * motion.ty.value + oy },
      { rotate: deg(turn) },
      { translateY: anim?.dy ?? 0 },
      { translateX: -ox },
      { translateY: -oy },
    ];
  });
  const opacity = useDerivedValue(() => animatedOpacity(animation, time.value) ?? box.opacity);
  const stillTransform = useMemo(
    () => [
      { translateX: box.x + ox },
      { translateY: box.y + oy },
      { rotate: deg(box.rotateDeg) },
      { translateX: -ox },
      { translateY: -oy },
    ],
    [box, ox, oy],
  );

  const mask = box.mask ? gradientShader(box.mask, box.w, box.h, motion.exp) : null;
  const fills = box.fills.map((layer, i) => {
    const shader = layerShader(layer, box.w, box.h, motion.exp);
    if (!shader) return null;
    return (
      <Path key={i} path={shape}>
        {mask ? (
          <Blend mode="dstIn">
            {shader}
            {mask}
          </Blend>
        ) : (
          shader
        )}
      </Path>
    );
  });
  const border = box.border;
  const borderPath = useMemo(
    () =>
      border
        ? roundedBox(
            border.width / 2,
            border.width / 2,
            box.w - border.width,
            box.h - border.width,
            grownRadii(box.radii, -border.width / 2),
          )
        : null,
    [border, box],
  );

  const layer =
    box.blur > 0 || box.blend !== 'srcOver' ? (
      <Paint blendMode={box.blend}>{box.blur > 0 ? <Blur blur={box.blur} /> : null}</Paint>
    ) : undefined;

  return (
    <Group
      transform={moving ? transform : stillTransform}
      opacity={animation ? opacity : box.opacity}
      {...(layer ? { layer } : {})}
    >
      {outer.length > 0 ? (
        <Group clip={shape} invertClip>
          {outer.map((s, i) => (
            <OuterShadow key={i} box={box} s={s} />
          ))}
        </Group>
      ) : null}
      {fills}
      {borderPath && border ? (
        <Path
          path={borderPath}
          style="stroke"
          strokeWidth={border.width}
          color={rgba(border.color)}
        >
          {mask ? (
            <Blend mode="dstIn">
              <ColorShader color={rgba(border.color)} />
              {mask}
            </Blend>
          ) : null}
        </Path>
      ) : null}
      {inset.length > 0 ? (
        <Group clip={shape}>
          {inset.map((s, i) => (
            <InsetShadow key={i} box={box} s={s} />
          ))}
        </Group>
      ) : null}
    </Group>
  );
}

/**
 * The atmosphere's boxes in paint order: each placed, rounded, filled, bordered, shadowed, masked,
 * blurred and blended as its CSS says, moved by its animation and by the phone's motion.
 */
export const BoxLayer = memo(function BoxLayer({
  boxes,
  time,
  motion,
}: {
  readonly boxes: readonly Box[];
  readonly time: SharedValue<number>;
  readonly motion: SceneMotion;
}) {
  return (
    <>
      {boxes.map((box, i) => (
        <BoxView key={i} box={box} time={time} motion={motion} />
      ))}
    </>
  );
});
