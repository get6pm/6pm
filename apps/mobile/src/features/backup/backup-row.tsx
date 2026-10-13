import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useClock } from '../../ui/theme/clock';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useEntitlement } from '../purchases/purchases-provider';
import type { BackupStatus } from './backup-service';
import { useBackupStatus } from './use-backup-status';
import { useWhenText } from './use-when-text';

/** What the row says on the right: "iCloud, just now", "Off", and so on. Empty while it loads. */
function valueOf(
  status: BackupStatus | null,
  max: boolean,
  now: number,
  t: ReturnType<typeof useI18n>['t'],
  whenText: (iso: string, now: number) => string,
): string {
  if (status === null) return '';
  switch (status.kind) {
    case 'off':
      // Without Max the row shows the badge instead of a state.
      return max ? t('backup.row.off') : '';
    case 'unsettled':
      return t('backup.row.found');
    case 'deleting':
      return t('backup.row.deleting');
    case 'on':
      return status.lastAt === null
        ? t('backup.row.off')
        : t('backup.row.on', { when: whenText(status.lastAt, now) });
  }
}

/**
 * The Backup row of "Your data" (prototype `App:2844`): a cloud tile, the label, a MAX lock badge
 * when the person is not on Max, the state, and a chevron. With Max it opens the Backup sheet;
 * without it, the Max sheet for the backup tile. A lapsed Max member who still has a backup can
 * open the sheet to delete it or take it back.
 */
export function BackupRow({ first = false }: { readonly first?: boolean }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { max } = useEntitlement();
  const { now } = useClock();
  const { status } = useBackupStatus();
  const whenText = useWhenText();
  const locked = !max && (status === null || status.kind === 'off');

  const open = () => {
    haptics.tick();
    if (locked) router.push({ pathname: '/max', params: { from: 'backup' } });
    else router.push('/backup');
  };

  return (
    <PressScale
      highlight
      onPress={open}
      accessibilityRole="button"
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
        <Symbol name="cloud" size={19} color={palette.ink} />
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
        <Text style={{ flex: 1, ...body(16), color: palette.ink }}>{t('backup.title')}</Text>
        {locked ? (
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
        ) : null}
        <Text style={{ ...body(15), color: palette.inkSoft }}>
          {valueOf(status, max, now.getTime(), t, whenText)}
        </Text>
        <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
      </View>
    </PressScale>
  );
}
