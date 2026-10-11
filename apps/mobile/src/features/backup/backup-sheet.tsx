import { useLocalSearchParams } from 'expo-router';

import { useI18n } from '../../i18n/i18n';
import { SheetScreen } from '../../ui/navigation/sheet-screen';
import { BackupManage } from './backup-manage';
import { BackupRestore } from './backup-restore';

/**
 * The Backup sheet. Opened from Settings it shows the state of backup; opened with `restore=1`
 * from the welcome step of a fresh install it offers to bring a backup back.
 */
export function BackupSheet() {
  const { t } = useI18n();
  const { restore } = useLocalSearchParams<{ restore?: string }>();
  const restoring = restore === '1';
  return (
    <SheetScreen title={restoring ? t('backup.restore.title') : t('backup.title')} gap={12}>
      {restoring ? <BackupRestore /> : <BackupManage />}
    </SheetScreen>
  );
}
