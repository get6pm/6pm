import type { CanvasRef } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo, type RefObject } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { clockOf } from '@6pm/domain';
import type { LookConfig, LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Sky } from '../../ui/sky/sky';
import { skyFrame } from '../../ui/sky/sky-frame';
import { SkySign } from '../../ui/sky/sky-sign';
import { useClock } from '../../ui/theme/clock';
import { display, leading, mono } from '../../ui/type/fonts';
import { useLookPreview } from './look-preview';

/**
 * What Today writes on a look's sky in a preview, in screen points: the date and the clock where
 * Today has them. `sign` adds Neon Alley's shop sign, for a picture of the sky that has only the
 * canvas (the sign is text drawn over it).
 */
export const PreviewFace = memo(function PreviewFace({
  look,
  hour,
  config,
  sign = false,
}: {
  readonly look: LookId;
  readonly hour: number;
  readonly config: Partial<LookConfig> | undefined;
  readonly sign?: boolean;
}) {
  const { weekday, dayMonth } = useI18n();
  const { dayDate } = useClock();
  const { palette } = useLookPreview(look, hour, config);
  const atm = useMemo(
    () =>
      sign
        ? skyFrame({
            look,
            hour,
            serious: false,
            closed: false,
            showSun: true,
            tab: 'today',
            ...(config ? { config } : {}),
          }).atm
        : null,
    [sign, look, hour, config],
  );
  return (
    <>
      {atm ? <SkySign atm={atm} dispFont={palette.dispFont} /> : null}
      <View style={{ position: 'absolute', left: 26, top: 238, gap: 12 }}>
        <Text
          style={{ ...mono(12, 400, 0.14), textTransform: 'uppercase', color: palette.inkSoft }}
        >
          {`${weekday(dayDate)} · ${dayMonth(dayDate)}`}
        </Text>
        <Text
          style={{
            ...leading(display(64, 400, -0.02, palette.dispFont), 64, true),
            fontVariant: ['tabular-nums'],
            color: palette.ink,
          }}
        >
          {clockOf(hour)}
        </Text>
      </View>
    </>
  );
});

/**
 * A look as Today would wear it, shrunk into a box `width` wide (the prototype's `LookSky`): the
 * real sky at `hour` with the date and the clock where Today has them, cut at `height`. `lift`
 * raises the picture by that many of the screen's points. The sky's clock runs only while
 * `running`, so a still preview is drawn once.
 */
export const LookSkyPreview = memo(function LookSkyPreview({
  look,
  hour,
  config,
  width,
  height,
  running,
  lift = 0,
  canvasRef,
}: {
  readonly look: LookId;
  readonly hour: number;
  readonly config: Partial<LookConfig> | undefined;
  readonly width: number;
  readonly height: number;
  readonly running: boolean;
  readonly lift?: number;
  /** The sky's canvas, for a still picture of it. */
  readonly canvasRef?: RefObject<CanvasRef | null>;
}) {
  const screen = useWindowDimensions();
  const { palette } = useLookPreview(look, hour, config);
  const scale = width / screen.width;
  const shift = lift * scale;

  const active = useSharedValue(running);
  useEffect(() => active.set(running), [active, running]);
  // Kept the same object between renders, so the memoised sky is not rebuilt when only
  // `running` changes (a card coming to the front of the pager).
  const box = useMemo(() => ({ width, height: height + shift }), [width, height, shift]);

  return (
    <View
      pointerEvents="none"
      style={{ width, height, overflow: 'hidden', backgroundImage: palette.sky }}
    >
      <View style={{ marginTop: -shift }}>
        <Sky
          look={look}
          hour={hour}
          serious={false}
          active={active}
          preview={box}
          {...(config ? { config } : {})}
          {...(canvasRef ? { canvasRef } : {})}
        />
      </View>
      <View
        style={[
          styles.screen,
          {
            width: screen.width,
            height: screen.height,
            transform: [{ translateY: -shift }, { scale }],
          },
        ]}
      >
        <PreviewFace look={look} hour={hour} config={config} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  screen: { position: 'absolute', left: 0, top: 0, transformOrigin: '0 0' },
});
