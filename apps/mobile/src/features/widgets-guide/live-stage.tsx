import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { formatVnd } from '@6pm/domain';
import { activityInk } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { Symbol } from '../../ui/icons/symbol';
import { body } from '../../ui/type/fonts';
import { Reveal, Touch } from '../capture-guide/walkthrough/moving-parts';
import { stage, type TouchStop } from '../capture-guide/walkthrough/timeline';
import type { WidgetPreview } from './preview-data';
import { Stage, stageInk, useLoop } from './stage';

const HEIGHT = 310;
const LOOP = 5600;
/** Reduce Motion holds the banner up, waiting for its Paid tap. */
const STILL = 0.42;
/** The example the guide pictures: a bowl of phở paid by QR. */
const AMOUNT = 45000;
const MERCHANT = 'Phở Hòa';
const BANNER_TOP = 170;
const PAID = { x: 402 - 16 - 14 - 40, y: BANNER_TOP + 14 + 23 } as const;

const TAPS: readonly TouchStop[] = [
  { at: 0.36, x: PAID.x + 30, y: HEIGHT + 30 },
  { at: 0.5, x: PAID.x, y: PAID.y, tap: true },
];

/**
 * The Lock Screen with the waiting-payment Live Activity (`SurfaceActivity.swift`): it rises
 * under the clock, Paid is tapped, it turns to a check and goes.
 */
export function LiveStage({
  preview,
  width,
}: {
  readonly preview: WidgetPreview;
  readonly width: number;
}) {
  const { t } = useI18n();
  const clock = useLoop(LOOP, STILL);
  const accent = preview.ink['accent'];
  const onAccent = preview.ink['onAccent'];
  return (
    <Stage t={clock} width={width} height={HEIGHT}>
      <View style={{ alignItems: 'center', paddingTop: 50 }}>
        <Text style={{ ...body(84, 700, -0.02), color: stageInk.white, lineHeight: 96 }}>9:41</Text>
      </View>
      <Reveal
        t={clock}
        from={0.08}
        to={0.26}
        dy={40}
        style={{ position: 'absolute', left: 16, right: 16, top: BANNER_TOP }}
      >
        <Gone t={clock}>
          <View
            style={{
              borderRadius: 26,
              backgroundColor: activityInk.banner,
              paddingTop: 14,
              paddingBottom: 14,
              paddingLeft: 16,
              paddingRight: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {preview.serious ? null : <Companion size={44} mood="calm" />}
            <View style={{ flex: 1, gap: 2 }}>
              <Text numberOfLines={1} style={{ ...body(12, 600), color: activityInk.caption }}>
                {t('surfaces.activity.waiting')}
              </Text>
              <Text numberOfLines={1} style={{ ...body(15, 650), color: activityInk.ink }}>
                {t('surfaces.activity.to', { amount: formatVnd(AMOUNT), merchant: MERCHANT })}
              </Text>
            </View>
            <View
              style={{
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 17,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(14, 650), color: onAccent }}>
                {t('surfaces.activity.paid')}
              </Text>
              <Reveal
                t={clock}
                from={0.52}
                to={0.6}
                fromScale={0.5}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 17,
                  backgroundColor: accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Symbol
                  name="check"
                  size={22}
                  weight={700}
                  {...(onAccent ? { color: onAccent } : {})}
                />
              </Reveal>
            </View>
          </View>
        </Gone>
      </Reveal>
      <Touch t={clock} stops={TAPS} />
    </Stage>
  );
}

/** The banner leaving once it is paid: it lifts, shrinks a little and fades. */
function Gone({ t, children }: { readonly t: SharedValue<number>; readonly children: ReactNode }) {
  const style = useAnimatedStyle(() => {
    const p = stage(t.get(), 0.66, 0.8);
    return { opacity: 1 - p, transform: [{ translateY: -14 * p }, { scale: 1 - 0.06 * p }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}
