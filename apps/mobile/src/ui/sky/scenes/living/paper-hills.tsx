import {
  BlurMask,
  Fill,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  RoundedRect,
  Rect,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { alternating } from '../../css-keyframes';
import { colorAt } from '../../sky-slots';
import {
  layerColor,
  PAPER_COLOR,
  type PaperCloud,
  type PaperGeometry,
  type PaperItem,
  type PaperLayer,
} from './paper-model';
import { shadowSilhouette } from './paper-shadow';
import { usePath } from './use-path';

/** Paper clouds drift ±12% of their own width on `fogDrift`. */
const DRIFT = 0.12;

interface FaceProps {
  readonly item: PaperItem;
  readonly paper: SharedValue<number[]>;
  readonly second: SharedValue<number[]>;
}

/** One piece of a layer in its paper, with the terrace rim or the ground's light lines. */
function Piece({ item, paper, second }: FaceProps) {
  const { face } = item;
  const hard = useDerivedValue(() => [paper.value, paper.value, second.value, second.value]);
  const shape = usePath(item.path);
  if (!shape) return null;
  if (face.kind === 'plain') return <Path path={shape} color={paper} />;
  const edge = face.first / face.period;
  if (face.kind === 'terrace') {
    // `repeating-radial-gradient(ellipse at 50% 100%)`: rings of `period` along the width, and
    // `2h / w` as tall as they are wide.
    const c = vec(item.l + item.w / 2, item.t + item.h);
    return (
      <Group clip={shape}>
        <Rect x={item.l} y={item.t} width={item.w} height={item.h}>
          <RadialGradient
            c={c}
            r={face.period}
            colors={hard}
            positions={[0, edge, edge, 1]}
            mode="repeat"
            origin={c}
            transform={[{ scaleY: (2 * item.h) / item.w }]}
          />
        </Rect>
      </Group>
    );
  }
  return (
    <Rect x={item.l} y={item.t} width={item.w} height={item.h}>
      <LinearGradient
        start={vec(0, item.t)}
        end={vec(0, item.t + face.period)}
        colors={hard}
        positions={[0, edge, edge, 1]}
        mode="repeat"
      />
    </Rect>
  );
}

interface LayerProps {
  readonly layer: PaperLayer;
  readonly index: number;
  readonly colors: SharedValue<number[]>;
  readonly scrollY: SharedValue<number>;
  readonly width: number;
}

function HillLayer({ layer, index, colors, scrollY, width }: LayerProps) {
  const at = layerColor(index);
  const paper = useDerivedValue(() => colorAt(colors.value, at));
  const second = useDerivedValue(() => colorAt(colors.value, at + 4));
  const shade = useDerivedValue(() => colorAt(colors.value, at + 8));
  const lift = useDerivedValue(() => [{ translateY: layer.factor * scrollY.value }]);
  const silhouette = useMemo(() => shadowSilhouette(layer, width), [layer, width]);
  return (
    <Group transform={lift}>
      {silhouette && (
        <Path path={silhouette} color={shade} transform={[{ translateY: layer.shadow.dy }]}>
          <BlurMask blur={layer.shadow.sigma} style="normal" respectCTM />
        </Path>
      )}
      {layer.items.map((item, i) => (
        <Piece key={i} item={item} paper={paper} second={second} />
      ))}
    </Group>
  );
}

interface CloudProps {
  readonly cloud: PaperCloud;
  readonly colors: SharedValue<number[]>;
  readonly time: SharedValue<number>;
}

/** A paper cloud: a pill with a soft drop shadow and a faint darker lip along its underside. */
export function PaperCloudShape({ cloud, colors, time }: CloudProps) {
  const { x, y, w, h } = cloud;
  const r = h / 2;
  const paper = useDerivedValue(() => colorAt(colors.value, PAPER_COLOR.cloud));
  const drift = useDerivedValue(() => [
    { translateX: w * DRIFT * (2 * alternating(time.value, cloud.periodMs) - 1) },
  ]);
  const pill = rrect(rect(x, y, w, h), r, r);
  const lifted = rrect(rect(x, y - 3, w, h), r, r);
  return (
    <Group transform={drift}>
      <RoundedRect x={x} y={y + 6} width={w} height={h} r={r} color="rgba(40,30,20,0.16)">
        <BlurMask blur={5} style="normal" respectCTM />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={w} height={h} r={r} color={paper} />
      <Group clip={pill}>
        <Group clip={lifted} invertClip>
          <Fill color="rgba(0,0,0,0.05)" />
        </Group>
      </Group>
    </Group>
  );
}

interface Props {
  readonly geometry: PaperGeometry;
  readonly colors: SharedValue<number[]>;
  readonly time: SharedValue<number>;
  readonly scrollY: SharedValue<number>;
  readonly width: number;
}

/** Drifting clouds, then five layers of paper from the farthest hills to the ground in front. */
export function PaperHills({ geometry, colors, time, scrollY, width }: Props) {
  return (
    <>
      {geometry.clouds.map((cloud, i) => (
        <PaperCloudShape key={i} cloud={cloud} colors={colors} time={time} />
      ))}
      {geometry.layers.map((layer, i) => (
        <HillLayer
          key={i}
          layer={layer}
          index={i}
          colors={colors}
          scrollY={scrollY}
          width={width}
        />
      ))}
    </>
  );
}
