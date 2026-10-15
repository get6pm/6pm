import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { body } from '../../ui/type/fonts';
import { Reveal, Touch } from '../capture-guide/walkthrough/moving-parts';
import { stage, type TouchStop } from '../capture-guide/walkthrough/timeline';
import { Stage, stageInk, useLoop } from './stage';

const LOOP = 4800;
/** Reduce Motion holds both controls in place, just before the tap. */
const STILL = 0.5;
const CELL = 72;
const GAP = 18;
const LEFT = (402 - (CELL * 4 + GAP * 3)) / 2;
const TOP = 64;
const BLOCK = CELL * 2 + GAP;
const ROW = TOP + BLOCK + GAP;
const HEIGHT = ROW + CELL + 42;

/** The finger comes in from below and taps Scan QR. */
const TAPS: readonly TouchStop[] = [
  { at: 0.42, x: LEFT + 2 * (CELL + GAP) + 60, y: HEIGHT + 20 },
  { at: 0.6, x: LEFT + 2 * (CELL + GAP) + CELL / 2, y: ROW + CELL / 2, tap: true },
];

/**
 * Control Center as iOS 18 lays it out: the connectivity and media modules, the torch and the
 * camera, then 6pm's two controls (`Controls.swift`), Scan QR and Quick add, landing in the grid.
 */
export function ControlStage({ width }: { readonly width: number }) {
  const { t } = useI18n();
  const clock = useLoop(LOOP, STILL);
  return (
    <Stage t={clock} width={width} height={HEIGHT}>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: stageInk.ccDim }} />
      <View style={{ position: 'absolute', left: LEFT, top: TOP, flexDirection: 'row', gap: GAP }}>
        <View
          style={{
            width: BLOCK,
            height: BLOCK,
            borderRadius: 36,
            backgroundColor: stageInk.ccGlass,
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: 14,
            gap: 14,
          }}
        >
          {(['flight', 'wifi', 'lan', 'router'] as const).map((g, k) => (
            <View
              key={g}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: k === 1 ? stageInk.white : stageInk.ccGlassStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Symbol name={g} size={28} color={k === 1 ? stageInk.black : stageInk.white} />
            </View>
          ))}
        </View>
        <View
          style={{
            width: BLOCK,
            height: BLOCK,
            borderRadius: 36,
            backgroundColor: stageInk.ccGlass,
            padding: 18,
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: stageInk.ccGlassStrong,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Symbol name="play_circle" size={34} color={stageInk.white} fill={1} />
          </View>
        </View>
      </View>
      <View style={{ position: 'absolute', left: LEFT, top: ROW, flexDirection: 'row', gap: GAP }}>
        <Round glyph="flashlight_on" />
        <Round glyph="photo_camera" />
        <Reveal
          t={clock}
          from={0.1}
          to={0.28}
          fromScale={0.4}
          style={{ alignItems: 'center', gap: 6 }}
        >
          <Round glyph="qr_code_scanner" pressed={{ t: clock, at: 0.6 }} />
          <Text style={{ ...body(12, 600), color: stageInk.white }}>{t('surfaces.scanQr')}</Text>
        </Reveal>
        <Reveal
          t={clock}
          from={0.2}
          to={0.38}
          fromScale={0.4}
          style={{ alignItems: 'center', gap: 6 }}
        >
          <Round glyph="add" />
          <Text style={{ ...body(12, 600), color: stageInk.white }}>{t('home.quickAdd')}</Text>
        </Reveal>
      </View>
      <Touch t={clock} stops={TAPS} />
    </Stage>
  );
}

/** A 1×1 control: a glass round with a white glyph; held, it turns white with a dark glyph. */
function Round({
  glyph,
  pressed,
}: {
  readonly glyph: SymbolName;
  readonly pressed?: { readonly t: SharedValue<number>; readonly at: number };
}) {
  return (
    <View
      style={{
        width: CELL,
        height: CELL,
        borderRadius: CELL / 2,
        backgroundColor: stageInk.ccGlass,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={glyph} size={32} color={stageInk.white} />
      {pressed ? <Lit t={pressed.t} at={pressed.at} glyph={glyph} /> : null}
    </View>
  );
}

/** The control lit under the finger from `at`, as Control Center answers a tap. */
function Lit({
  t,
  at,
  glyph,
}: {
  readonly t: SharedValue<number>;
  readonly at: number;
  readonly glyph: SymbolName;
}) {
  const style = useAnimatedStyle(() => {
    const on = stage(t.get(), at - 0.02, at + 0.02);
    return { opacity: on, transform: [{ scale: 1 + 0.08 * on }] };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          inset: 0,
          borderRadius: CELL / 2,
          backgroundColor: stageInk.white,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Symbol name={glyph} size={32} color={stageInk.black} />
    </Animated.View>
  );
}
