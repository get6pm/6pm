import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { oklchSrgbHex, paletteFor, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { Companion } from '../../ui/companion/companion';
import { Symbol } from '../../ui/icons/symbol';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, mono } from '../../ui/type/fonts';
import { PAID_LOOKS } from './products';
import type { MaxFrom } from './max-context';
import { MAX_CREAM, MAX_FONT, MAX_INK, MAX_WELL } from './max-colours';

/** A progress ring: a track with an arc over it, 28 pt, the hole cut in the tile's colour. */
function Donut({ fraction, color }: { readonly fraction: number; readonly color: string }) {
  const ring = useMemo(() => Skia.Path.Make().addCircle(14, 14, 9.5), []);
  return (
    <Canvas style={{ width: 28, height: 28 }}>
      <Circle
        cx={14}
        cy={14}
        r={9.5}
        style="stroke"
        strokeWidth={9}
        color="rgba(255,255,255,.12)"
      />
      <Group transform={[{ rotate: -Math.PI / 2 }]} origin={{ x: 14, y: 14 }}>
        <Path path={ring} style="stroke" strokeWidth={9} color={color} start={0} end={fraction} />
      </Group>
    </Canvas>
  );
}

/** The paid looks as overlapping discs, each in its own sky. */
function LookSwatches({
  hour,
  configs,
}: {
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
}) {
  const skies = useMemo(
    () =>
      PAID_LOOKS.map(
        (look) => paletteFor({ look, hour, serious: false, config: configs[look] ?? {} }).sky,
      ),
    [hour, configs],
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {skies.map((sky, i) => (
        <View
          key={PAID_LOOKS[i]}
          style={{
            width: 26,
            height: 26,
            marginRight: -7,
            borderRadius: 13,
            backgroundImage: sky,
            boxShadow: `0 0 0 2px ${MAX_WELL}`,
          }}
        />
      ))}
    </View>
  );
}

/** The small picture on each feature tile (prototype `App:1021-1039`). */
export function TileArt({
  tile,
  hour,
  configs,
  safe,
}: {
  readonly tile: MaxFrom;
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  /** Today's safe-to-spend as short text, for the widget. */
  readonly safe: string;
}) {
  const { t } = useI18n();
  const { palette } = useTheme();
  const { now } = useClock();
  switch (tile) {
    case 'looks':
      return <LookSwatches hour={hour} configs={configs} />;
    case 'ask':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ ...leading(display(40, 500, 0, MAX_FONT), 32), color: MAX_CREAM }}>∞</Text>
          <View
            style={{
              height: 24,
              paddingHorizontal: 9,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              borderBottomLeftRadius: 4,
              backgroundColor: MAX_CREAM,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(11, 650), color: MAX_INK }}>{t('max.tile.askBubble')}</Text>
          </View>
        </View>
      );
    case 'pots':
      return (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Donut fraction={0.72} color={oklchSrgbHex(0.8, 0.13, 150)} />
          <Donut fraction={0.4} color={oklchSrgbHex(0.8, 0.12, 60)} />
          <Donut fraction={0.88} color={oklchSrgbHex(0.8, 0.12, 300)} />
        </View>
      );
    case 'travel':
      return (
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {['₫', '฿', '¥', '€'].map((sign) => (
            <View
              key={sign}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: 'rgba(255,255,255,.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(13, 700), color: MAX_CREAM }}>{sign}</Text>
            </View>
          ))}
        </View>
      );
    case 'diary':
      return (
        <View
          style={{
            width: 38,
            height: 50,
            borderTopLeftRadius: 3,
            borderBottomLeftRadius: 3,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            backgroundColor: oklchSrgbHex(0.82, 0.09, 50),
            boxShadow: '0 6px 14px rgba(0,0,0,.35)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: 'rgba(0,0,0,.15)',
            }}
          />
          <Text
            style={{
              ...mono(8.5, 600, 0.06),
              position: 'absolute',
              left: 8,
              bottom: 6,
              color: '#2a1408',
            }}
          >
            {now.getFullYear()}
          </Text>
        </View>
      );
    case 'backup':
      return (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            backgroundColor: 'rgba(255,255,255,.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="cloud_done" size={24} fill={1} color={oklchSrgbHex(0.82, 0.1, 230)} />
        </View>
      );
    case 'widgets':
      return (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            paddingTop: 6,
            paddingHorizontal: 7,
            paddingBottom: 6,
            backgroundImage: palette.sky,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.15)',
            justifyContent: 'flex-end',
          }}
        >
          <Text
            style={{
              ...leading(display(15, 600), 15),
              color: '#ffffff',
              textShadowColor: 'rgba(0,0,0,.4)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {safe}
          </Text>
        </View>
      );
    case 'icons':
      return (
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {(
            [
              ['ramen_dining', 45],
              ['electric_moped', 220],
              ['diamond', 330],
            ] as const
          ).map(([icon, hue]) => (
            <CategoryTile key={icon} icon={icon} hue={hue} size={28} radius={9} glyph={17} />
          ))}
        </View>
      );
    case 'buddy':
      return (
        <View style={{ height: 40, flexDirection: 'row', alignItems: 'center' }}>
          <Companion size={48} mood="calm" form="max" />
          <Companion size={48} mood="calm" form="hac" />
        </View>
      );
  }
}
