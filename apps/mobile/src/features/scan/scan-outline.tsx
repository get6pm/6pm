import { Canvas, CornerPathEffect, Path, Skia } from '@shopify/react-native-skia';
import { View } from 'react-native';
import { interpolateColor, useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { scanColours as c } from './scan-colours';

/** The prototype's frame: 46 pt arms, 3.5 pt stroke, 26 pt corners. */
const ARM = 46;
const STROKE = 3.5;
const RADIUS = 26;
/** On a small or skewed receipt an arm never reaches past a third of its edge. */
const ARM_SHARE = 0.3;

/**
 * The frame's four corners, drawn on the UI thread from `quad` (`[x0, y0, …, x3, y3]` in view
 * points). Looking, `quad` is the prototype's square frame; once a receipt is in view it animates to
 * the paper's corners, so the frame itself closes onto the receipt, with the paper washed in the
 * accent as `seen` rises. The corners take on the accent as the receipt is held still (`steady`).
 */
export function ScanOutline({
  quad,
  seen,
  steady,
  accent,
}: {
  readonly quad: SharedValue<number[]>;
  readonly seen: SharedValue<number>;
  readonly steady: SharedValue<number>;
  readonly accent: string;
}) {
  const corners = useDerivedValue(() => {
    const q = quad.value;
    const path = Skia.Path.Make();
    for (let i = 0; i < 4; i += 1) {
      const x = q[i * 2] ?? 0;
      const y = q[i * 2 + 1] ?? 0;
      for (const [j, first] of [
        [(i + 3) % 4, true],
        [(i + 1) % 4, false],
      ] as const) {
        const dx = (q[j * 2] ?? 0) - x;
        const dy = (q[j * 2 + 1] ?? 0) - y;
        const length = Math.hypot(dx, dy) || 1;
        const arm = Math.min(ARM, length * ARM_SHARE);
        const ax = x + (dx / length) * arm;
        const ay = y + (dy / length) * arm;
        if (first) {
          path.moveTo(ax, ay);
          path.lineTo(x, y);
        } else {
          path.lineTo(ax, ay);
        }
      }
    }
    return path;
  });
  const paper = useDerivedValue(() => {
    const q = quad.value;
    const path = Skia.Path.Make();
    path.moveTo(q[0] ?? 0, q[1] ?? 0);
    for (let i = 1; i < 4; i += 1) path.lineTo(q[i * 2] ?? 0, q[i * 2 + 1] ?? 0);
    path.close();
    return path;
  });
  const wash = useDerivedValue(() => seen.value * 0.16);
  const edge = useDerivedValue(() => seen.value * 0.7);
  const ink = useDerivedValue(() => interpolateColor(steady.value, [0, 1], [c.frame, accent]));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      <Canvas style={{ flex: 1 }}>
        <Path path={paper} color={accent} opacity={wash} />
        <Path path={paper} color={accent} opacity={edge} style="stroke" strokeWidth={1.5}>
          <CornerPathEffect r={10} />
        </Path>
        <Path
          path={corners}
          color={ink}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          strokeJoin="round"
        >
          <CornerPathEffect r={RADIUS} />
        </Path>
      </Canvas>
    </View>
  );
}

/** The square frame the corners rest on while looking, `size` wide with its top at `top`. */
export function restingQuad(width: number, top: number, size: number): number[] {
  const left = (width - size) / 2;
  const right = left + size;
  const bottom = top + size;
  return [left, top, right, top, right, bottom, left, bottom];
}
