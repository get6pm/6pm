import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { oklchSrgbHex, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { Companion } from '../../ui/companion/companion';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { Symbol } from '../../ui/icons/symbol';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, mono } from '../../ui/type/fonts';
import { LookSkyPreview } from '../looks/look-sky-preview';
import type { MaxFrom } from './max-context';
import { SCENE_LOOKS } from './products';
import { MAX_CREAM, MAX_INK } from './max-colours';

/** The tiles' dark well, behind discs that overlap. */
const WELL = '#1a1822';
const ok = oklchSrgbHex;

/** The category tiles both the tile and the Icons hero show: glyph and hue. */
export const ICON_SAMPLES: readonly (readonly [SymbolName, number])[] = [
  ['ramen_dining', 45],
  ['electric_moped', 220],
  ['diamond', 330],
  ['potted_plant', 150],
  ['local_cafe', 80],
  ['headphones', 270],
  ['pets', 20],
  ['flight_takeoff', 190],
  ['spa', 120],
];

/** A jar filled to `fill` in its hue: the pots, as the tile and the Pots hero draw them. */
export function Jar({
  fill,
  hue,
  width,
  height,
  radius,
  light = 0.78,
}: {
  readonly fill: number;
  readonly hue: number;
  readonly width: number;
  readonly height: number;
  readonly radius: readonly [top: number, bottom: number];
  readonly light?: number;
}) {
  return (
    <View
      style={{
        width,
        height,
        borderTopLeftRadius: radius[0],
        borderTopRightRadius: radius[0],
        borderBottomLeftRadius: radius[1],
        borderBottomRightRadius: radius[1],
        backgroundColor: 'rgba(255,255,255,.1)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${fill * 100}%`,
          backgroundColor: ok(light, 0.13, hue),
        }}
      />
    </View>
  );
}

/** A currency coin in its hue; cream for the dollar. */
export function Coin({
  sign,
  hue,
  size,
  font,
  ring,
}: {
  readonly sign: string;
  readonly hue: number | null;
  readonly size: number;
  readonly font: number;
  readonly ring: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: hue === null ? MAX_CREAM : ok(0.84, 0.1, hue),
        boxShadow: ring,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ ...body(font, 800), color: hue === null ? MAX_INK : ok(0.25, 0.06, hue) }}>
        {sign}
      </Text>
    </View>
  );
}

/** The spines of past diaries, in their colours: the shelf. */
export const SPINES = [
  [20, 0.55],
  [150, 0.6],
  [250, 0.62],
  [320, 0.6],
] as const;

/** The picture at the top of each feature tile (prototype `App:1087-1097`). */
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
      return (
        <View
          style={{
            height: 60,
            paddingTop: 2,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          {SCENE_LOOKS.map((look) => (
            <View
              key={look}
              style={{
                width: 42,
                height: 58,
                borderRadius: 11,
                overflow: 'hidden',
                boxShadow: '0 6px 14px rgba(0,0,0,.4)',
              }}
            >
              <LookSkyPreview
                look={look}
                hour={hour}
                config={configs[look]}
                width={42}
                height={58}
                running={false}
                lift={20}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  borderRadius: 11,
                  boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,.2)',
                }}
              />
            </View>
          ))}
        </View>
      );
    case 'ask':
      return (
        <View style={{ gap: 5, alignItems: 'flex-start' }}>
          <View
            style={{
              height: 26,
              paddingHorizontal: 10,
              borderRadius: 13,
              borderBottomLeftRadius: 4,
              backgroundColor: 'rgba(255,255,255,.12)',
              justifyContent: 'center',
            }}
          >
            <Text numberOfLines={1} style={{ ...body(11.5, 600), color: MAX_CREAM }}>
              {t('max.tile.askQ')}
            </Text>
          </View>
          <View
            style={{
              alignSelf: 'flex-end',
              height: 26,
              paddingHorizontal: 10,
              borderRadius: 13,
              borderBottomRightRadius: 4,
              backgroundColor: MAX_CREAM,
              justifyContent: 'center',
            }}
          >
            <Text numberOfLines={1} style={{ ...body(11.5, 650), color: MAX_INK }}>
              {t('max.tile.askA')}
            </Text>
          </View>
        </View>
      );
    case 'pots':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <Jar fill={0.7} hue={150} width={34} height={46} radius={[8, 11]} />
          <Jar fill={0.4} hue={60} width={34} height={46} radius={[8, 11]} light={0.82} />
          <Jar fill={0.9} hue={300} width={34} height={46} radius={[8, 11]} light={0.8} />
          <View
            style={{
              marginLeft: 2,
              height: 24,
              paddingHorizontal: 8,
              borderRadius: 99,
              backgroundColor: MAX_CREAM,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(11, 800), color: MAX_INK }}>+100k</Text>
          </View>
        </View>
      );
    case 'travel':
      return (
        <View style={{ flexDirection: 'row', paddingLeft: 9 }}>
          {(
            [
              ['฿', 210],
              ['¥', 80],
              ['€', 300],
              ['$', null],
            ] as const
          ).map(([sign, hue]) => (
            <View key={sign}>
              <Coin
                sign={sign}
                hue={hue}
                size={30}
                font={13}
                ring={`0 0 0 2px ${WELL}, 0 4px 10px rgba(0,0,0,.35)`}
              />
            </View>
          ))}
        </View>
      );
    case 'diary':
      return (
        <View style={{ height: 56, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
          {SPINES.slice(0, 3).map(([hue, light], i) => (
            <View
              key={hue}
              style={{
                width: 16,
                height: [48, 52, 46][i],
                borderRadius: 3,
                backgroundColor: ok(light, 0.1, hue),
                boxShadow: 'inset -2px 0 0 rgba(0,0,0,.2)',
              }}
            />
          ))}
          <View
            style={{
              width: 38,
              height: 56,
              marginLeft: 4,
              borderTopLeftRadius: 3,
              borderBottomLeftRadius: 3,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              backgroundColor: ok(0.82, 0.09, 50),
              boxShadow: '0 8px 16px rgba(0,0,0,.4)',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 5,
                backgroundColor: 'rgba(0,0,0,.18)',
              }}
            />
            <Text
              style={{
                ...mono(9, 600, 0.06),
                position: 'absolute',
                left: 10,
                bottom: 7,
                color: '#2a1408',
              }}
            >
              {now.getFullYear()}
            </Text>
          </View>
        </View>
      );
    case 'backup':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundImage: `linear-gradient(160deg, ${ok(0.5, 0.1, 190)}, ${ok(0.36, 0.08, 200)})`,
              boxShadow: '0 6px 14px rgba(0,0,0,.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="cloud_done" size={26} fill={1} color="#ffffff" />
          </View>
          <View
            style={{
              height: 24,
              paddingLeft: 6,
              paddingRight: 8,
              borderRadius: 99,
              backgroundColor: 'rgba(255,255,255,.1)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Symbol name="lock" size={13} fill={1} color={MAX_CREAM} />
            <Text numberOfLines={1} style={{ ...body(11, 650), color: MAX_CREAM }}>
              {t('max.tile.encrypted')}
            </Text>
          </View>
        </View>
      );
    case 'widgets':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 15,
              paddingVertical: 7,
              paddingHorizontal: 8,
              backgroundImage: palette.sky,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16), 0 8px 16px rgba(0,0,0,.35)',
              justifyContent: 'flex-end',
              gap: 2,
            }}
          >
            <Text
              style={{
                ...body(7, 700, 0.06),
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.75)',
              }}
            >
              {t('max.tile.safe')}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                ...leading(display(16, 600), 16),
                color: '#ffffff',
                textShadowColor: 'rgba(0,0,0,.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              {safe}
            </Text>
          </View>
          <LockRing safe={safe} size={40} inset={5} font={9} well={WELL} />
        </View>
      );
    case 'icons':
      return (
        <View style={{ width: 100, flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {ICON_SAMPLES.slice(0, 6).map(([icon, hue]) => (
            <View key={icon} style={{ borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,.25)' }}>
              <CategoryTile icon={icon} hue={hue} size={30} radius={10} glyph={17} />
            </View>
          ))}
        </View>
      );
    case 'buddy':
      return (
        <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Companion size={52} mood="happy" form="max" />
          <Companion size={52} mood="calm" form="hac" />
        </View>
      );
  }
}

/** The Lock Screen widget: a ring two-thirds round with today's number in its hole. */
export function LockRing({
  safe,
  size,
  inset,
  font,
  well,
}: {
  readonly safe: string;
  readonly size: number;
  readonly inset: number;
  readonly font: number;
  readonly well: string;
}) {
  const r = (size - inset) / 2;
  const arc = useMemo(() => Skia.Path.Make().addCircle(size / 2, size / 2, r), [size, r]);
  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - inset} color={well} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          style="stroke"
          strokeWidth={inset}
          color="rgba(255,255,255,.14)"
        />
        <Group transform={[{ rotate: -Math.PI / 2 }]} origin={{ x: size / 2, y: size / 2 }}>
          <Path
            path={arc}
            style="stroke"
            strokeWidth={inset}
            color={MAX_CREAM}
            start={0}
            end={0.68}
          />
        </Group>
      </Canvas>
      <View
        style={{
          position: 'absolute',
          top: inset,
          right: inset,
          bottom: inset,
          left: inset,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ ...body(font, 800), color: MAX_CREAM, paddingHorizontal: 2 }}
        >
          {safe}
        </Text>
      </View>
    </View>
  );
}
