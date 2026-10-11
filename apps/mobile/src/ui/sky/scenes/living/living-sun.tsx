import {
  BlurMask,
  Circle,
  Fill,
  Group,
  RadialGradient,
  Rect,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { colorAt } from '../../sky-slots';
import { useSwitchedTween } from '../../use-switched-tween';
import type { SceneProps, SunFlag } from '../scene-props';
import { paperSunModel, SUN_VALUE } from './paper-sun-model';

export interface LivingSunProps extends SceneProps {
  /** The sun belongs to the Today tab only, as for the shared sun. */
  readonly sun: SunFlag;
}

/**
 * The sun of looks that restyle it beyond what the shared sun draws. Today that is Paper
 * Diorama's: a paper disc hung on a thread, with a drop shadow offset down onto the hills and a
 * shaded crescent. Draw it in the sun's parallax group in place of the shared sun, which must not
 * draw for this look; it returns null for every other look.
 */
export function LivingSun({ look, config, hour, serious, palette, sun, width }: LivingSunProps) {
  // Everything but the tweened numbers is the same with the sun shown or hidden.
  const model = useMemo(
    () => paperSunModel({ look, config, hour, serious, palette, showSun: true }),
    [look, config, hour, serious, palette],
  );
  const hidden = useMemo(
    () => paperSunModel({ look, config, hour, serious, palette, showSun: false }).values,
    [look, config, hour, serious, palette],
  );
  const tween = useSwitchedTween(model.values, hidden, sun.flag, sun.initial);
  const cx = useDerivedValue(() => (tween.value[SUN_VALUE.x] ?? 0) * width);
  const cy = useDerivedValue(() => tween.value[SUN_VALUE.y] ?? 0);
  const size = useDerivedValue(() => tween.value[SUN_VALUE.size] ?? 0);
  const radius = useDerivedValue(() => size.value / 2);
  const opacity = useDerivedValue(() => tween.value[SUN_VALUE.opacity] ?? 0);

  const castY = useDerivedValue(() => cy.value + model.cast.dy);
  const castColor = useDerivedValue(() => {
    const [r, g, b, a] = model.cast.color;
    return [r, g, b, a * opacity.value];
  });
  const crescentColor = useDerivedValue(() => {
    const [r, g, b, a] = model.crescent.color;
    return [r, g, b, a * opacity.value];
  });

  const disc = useDerivedValue(() => {
    const r = radius.value;
    return rrect(rect(cx.value - r, cy.value - r, 2 * r, 2 * r), r, r);
  });
  const shifted = useDerivedValue(() => {
    const r = radius.value;
    const x = cx.value - r + model.crescent.dx;
    const y = cy.value - r + model.crescent.dy;
    return rrect(rect(x, y, 2 * r, 2 * r), r, r);
  });

  // `radial-gradient(circle at 40% 35%, …)` over the disc's box: farthest-corner radius.
  const { focus, bodyAt } = model;
  const focusC = useDerivedValue(() =>
    vec(
      cx.value - radius.value + focus.x * size.value,
      cy.value - radius.value + focus.y * size.value,
    ),
  );
  const focusR = useDerivedValue(
    () => size.value * Math.hypot(Math.max(focus.x, 1 - focus.x), Math.max(focus.y, 1 - focus.y)),
  );
  const colors = useDerivedValue(() => [
    colorAt(tween.value, SUN_VALUE.light),
    colorAt(tween.value, SUN_VALUE.body),
  ]);

  const threadColor = useDerivedValue(() =>
    colorAt(tween.value, SUN_VALUE.thread, tween.value[SUN_VALUE.threadOpacity] ?? 0),
  );
  if (look !== 'paper') return null;
  return (
    <>
      {/* `left: x; width: 1px; top: 0; height: <sun top>`: a hairline from the top of the screen. */}
      <Rect x={cx} y={0} width={1} height={cy} color={threadColor} />
      <Group clip={disc} invertClip>
        <Circle cx={cx} cy={castY} r={radius} color={castColor}>
          <BlurMask blur={model.cast.sigma} style="normal" respectCTM />
        </Circle>
      </Group>
      <Circle cx={cx} cy={cy} r={radius} opacity={opacity}>
        <RadialGradient c={focusC} r={focusR} colors={colors} positions={[0, bodyAt]} />
      </Circle>
      <Group clip={disc}>
        <Group clip={shifted} invertClip>
          <Fill color={crescentColor} />
        </Group>
      </Group>
    </>
  );
}
