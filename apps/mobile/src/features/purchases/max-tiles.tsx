import { useMemo } from 'react';
import { Text, View } from 'react-native';

import type { LookConfig, LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { body } from '../../ui/type/fonts';
import { tileOrder, tileRows, type MaxFrom } from './max-context';
import { TileArt } from './max-tile-art';
import { PAID_LOOKS, SCENE_LOOKS } from './products';
import { MAX_CREAM, MAX_GOLD } from './max-colours';

/**
 * The feature tiles (prototype `App:1014-1042`), two to a row with the Looks across both. The one
 * that Max was opened for comes first, ringed in gold while Max is off.
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
    return (
      <View
        key={id}
        style={{
          flex: 1,
          minHeight: 108,
          padding: 14,
          borderRadius: 20,
          backgroundColor: hot ? 'rgba(255,210,122,.1)' : 'rgba(255,255,255,.05)',
          ...(hot ? { boxShadow: `0 0 0 2px ${MAX_GOLD}` } : {}),
          flexDirection: id === 'looks' ? 'row' : 'column',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={id === 'looks' ? { justifyContent: 'center' } : undefined}>
          <TileArt tile={id} hour={hour} configs={configs} safe={safe} />
        </View>
        <View style={{ gap: 2, justifyContent: 'flex-end' }}>
          <Text style={{ ...body(14.5, 650), lineHeight: 17.4, color: MAX_CREAM }}>
            {t(`max.tile.${id}`)}
          </Text>
          {id === 'looks' ? (
            <Text style={{ ...body(12), color: 'rgba(246,239,230,.6)' }}>
              {t('max.tile.looksNote', {
                looks: PAID_LOOKS.length,
                scenes: SCENE_LOOKS.length,
              })}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ gap: 10 }}>
      {rows.map((row) => (
        <View key={row.join()} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map(tile)}
          {row.length === 1 && row[0] !== 'looks' ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
