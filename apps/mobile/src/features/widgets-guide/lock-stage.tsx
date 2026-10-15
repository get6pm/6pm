import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { activityInk } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { body, display } from '../../ui/type/fonts';
import { Reveal } from '../capture-guide/walkthrough/moving-parts';
import { stage } from '../capture-guide/walkthrough/timeline';
import type { WidgetPreview } from './preview-data';
import { Stage, stageInk, useLoop } from './stage';

const HEIGHT = 330;
const LOOP = 5200;
/** The settled picture Reduce Motion holds: both widgets in, the ring filled. */
const STILL = 0.8;
const RING = 76;
const STROKE = 5;

/** The top of the Lock Screen: the date, the clock, and 6pm's ring and card under it. */
export function LockStage({
  preview,
  width,
}: {
  readonly preview: WidgetPreview;
  readonly width: number;
}) {
  const { t, language } = useI18n();
  const clock = useLoop(LOOP, STILL);
  return (
    <Stage t={clock} width={width} height={HEIGHT}>
      <View style={{ alignItems: 'center', paddingTop: 58 }}>
        <Text style={{ ...body(20, 600), color: stageInk.whiteSoft }}>
          {new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        <Text style={{ ...body(104, 700, -0.02), color: stageInk.white, lineHeight: 118 }}>
          9:41
        </Text>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
          <Reveal
            t={clock}
            from={0.12}
            to={0.32}
            fromScale={0.7}
            style={{ alignItems: 'center', gap: 8 }}
          >
            <Ring t={clock} preview={preview} />
            <Text style={{ ...body(12, 600), color: stageInk.whiteSoft }}>
              {t('widgetsGuide.lock.ring')}
            </Text>
          </Reveal>
          <Reveal
            t={clock}
            from={0.24}
            to={0.44}
            fromScale={0.85}
            dx={-12}
            style={{ alignItems: 'center', gap: 8 }}
          >
            <Card preview={preview} />
            <Text style={{ ...body(12, 600), color: stageInk.whiteSoft }}>
              {t('widgetsGuide.lock.card')}
            </Text>
          </Reveal>
        </View>
      </View>
    </Stage>
  );
}

const circle = (() => {
  const path = Skia.Path.Make();
  const r = (RING - STROKE) / 2;
  // From twelve o'clock, clockwise, as the SwiftUI ring trims.
  path.addArc({ x: STROKE / 2, y: STROKE / 2, width: r * 2, height: r * 2 }, -90, 359.999);
  return path;
})();

/** The ring: what is left of today's line, "245k" over "left", filling as it lands. */
function Ring({
  t,
  preview,
}: {
  readonly t: SharedValue<number>;
  readonly preview: WidgetPreview;
}) {
  const fraction = preview.entry?.ringFraction ?? 0;
  const end = useDerivedValue(() => fraction * stage(t.get(), 0.3, 0.62));
  return (
    <View
      style={{
        width: RING,
        height: RING,
        borderRadius: RING / 2,
        backgroundColor: stageInk.ccGlass,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Canvas style={{ position: 'absolute', inset: 0 }}>
        <Path path={circle} style="stroke" strokeWidth={STROKE} color={activityInk.ringTrack} />
        <Path
          path={circle}
          style="stroke"
          strokeWidth={STROKE}
          color={activityInk.ink}
          start={0}
          end={end}
        />
      </Canvas>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{ ...body(17, 700, -0.02), color: activityInk.ink, maxWidth: RING - 14 }}
      >
        {preview.entry?.safeShort ?? '–'}
      </Text>
      <Text style={{ ...body(10, 600), color: activityInk.ink, opacity: 0.75 }}>
        {preview.strings['left']}
      </Text>
    </View>
  );
}

/** The card: "6pm · Safe today", the number, and what is pending. */
function Card({ preview }: { readonly preview: WidgetPreview }) {
  const entry = preview.entry;
  return (
    <View
      style={{
        width: 172,
        height: RING,
        borderRadius: 20,
        backgroundColor: stageInk.ccGlass,
        paddingHorizontal: 14,
        paddingVertical: 10,
        justifyContent: 'center',
        gap: 2,
      }}
    >
      {entry ? (
        <>
          <Text
            numberOfLines={1}
            style={{ ...body(12, 600), color: activityInk.ink, opacity: 0.75 }}
          >
            {preview.strings['brandSafe']}
          </Text>
          <Text
            numberOfLines={1}
            style={{ ...display(28, 500, 0, preview.palette.dispFont), color: activityInk.ink }}
          >
            {entry.safeShort}
          </Text>
          {entry.pendingText ? (
            <Text style={{ ...body(12, 600), color: activityInk.ink, opacity: 0.75 }}>
              {entry.pendingText}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={{ ...body(12, 600), color: activityInk.ink }}>{preview.strings['setUp']}</Text>
      )}
    </View>
  );
}
