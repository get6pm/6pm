import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { oklchSrgbHex, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { body } from '../../ui/type/fonts';
import { tileOrder, tileRows, type MaxFrom } from './max-context';
import { TileArt } from './max-tile-art';
import { PAID_LOOKS, SCENE_LOOKS } from './products';
import { MAX_CREAM, MAX_GOLD } from './max-colours';

/** Each tile's own colour, glowing from its top right corner. */
const HUE: Readonly<Record<MaxFrom, number>> = {
  looks: 30,
  ask: 300,
  pots: 150,
  travel: 210,
  diary: 50,
  backup: 190,
  widgets: 80,
  icons: 330,
  buddy: 60,
};

/** `oklch(0.36 0.07 h / a)` as CSS hex with alpha. */
function glow(hue: number, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${oklchSrgbHex(0.36, 0.07, hue)}${a}`;
}

/**
 * Everything Max adds, two tiles to a row, each with its own picture (prototype `App:1085-1100`).
 * The one Max was opened for comes first, ringed in gold with a dot by its name while Max is off.
 */
export function MaxTiles({
  from,
  on,
  hour,
  configs,
  safe,
}: {
  readonly from: MaxFrom;
  readonly on: boolean;
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly safe: string;
}) {
  const { t } = useI18n();
  const rows = useMemo(() => tileRows(tileOrder(from)), [from]);

  const tile = (id: MaxFrom) => {
    const hot = !on && id === from;
    const note =
      id === 'looks'
        ? t('max.tile.looksNote', { looks: PAID_LOOKS.length, scenes: SCENE_LOOKS.length })
        : t(`max.note.${id}`);
    return (
      <View
        key={id}
        style={{
          flex: 1,
          minHeight: 140,
          padding: 14,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundImage: `radial-gradient(130% 110% at 100% 0%, ${glow(HUE[id], hot ? 0.75 : 0.55)} 0%, rgba(255,255,255,.04) 70%)`,
          boxShadow: hot
            ? `0 0 0 1.5px ${MAX_GOLD}, inset 0 0 0 0.5px rgba(255,255,255,.08)`
            : 'inset 0 0 0 0.5px rgba(255,255,255,.08)',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <TileArt tile={id} hour={hour} configs={configs} safe={safe} />
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ ...body(15, 650), lineHeight: 18, color: MAX_CREAM, flexShrink: 1 }}>
              {t(`max.tile.${id}`)}
            </Text>
            {hot ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: MAX_GOLD,
                  boxShadow: '0 0 0 3px rgba(255,210,122,.25)',
                }}
              />
            ) : null}
          </View>
          <Text style={{ ...body(12), lineHeight: 16.2, color: 'rgba(246,239,230,.62)' }}>
            {note}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ gap: 10 }}>
      {rows.map((row) => (
        <View key={row.join()} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map(tile)}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
