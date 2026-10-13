import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useEntitlement } from '../purchases/purchases-provider';
import { useExportSpends } from './use-export-spends';

/**
 * The Export row of "Your data" (prototype `App:2844`): a download tile, the label, and with Max
 * "CSV · Sheets" and a chevron; without it, a MAX lock badge. With Max it shares a CSV of every
 * spend (Files, Numbers, or Google Sheets from the share sheet); without it, the Max sheet opens
 * on the backup tile, which promises "CSV and Sheets".
 */
export function ExportRow({ first = false }: { readonly first?: boolean }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { max } = useEntitlement();
  const { run, busy } = useExportSpends();

  const open = () => {
    haptics.tick();
    if (!max) router.push({ pathname: '/max', params: { from: 'backup' } });
    else void run();
  };

  return (
    <PressScale
      highlight
      onPress={open}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: palette.chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="download" size={19} color={palette.ink} />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 13,
          borderTopWidth: 0.5,
          borderTopColor: first ? 'transparent' : palette.hair,
        }}
      >
        <Text style={{ flex: 1, ...body(16), color: palette.ink }}>{t('export.title')}</Text>
        {max ? null : (
          <View
            style={{
              height: 20,
              paddingLeft: 5,
              paddingRight: 7,
              borderRadius: 6,
              backgroundColor: palette.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Symbol name="lock" size={12} fill={1} color={palette.sheetSolid} />
            <Text style={{ ...body(10, 800, 0.1), color: palette.sheetSolid }}>MAX</Text>
          </View>
        )}
        {max ? (
          <Text style={{ ...body(15), color: palette.inkSoft }}>{t('export.row.value')}</Text>
        ) : null}
        <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
      </View>
    </PressScale>
  );
}
