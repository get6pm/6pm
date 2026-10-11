import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { useToast } from '../../ui/toast/toast-host';
import { useEntitlement } from '../purchases/purchases-provider';
import { isBackupError } from './backup-error';
import { errorKeyOf, type BackupErrorKey } from './backup-messages';
import { BackupManageBody, type Armed, type Found } from './backup-manage-body';
import { BackupNote } from './backup-parts';
import { useApplyRestore } from './use-apply-restore';
import { useBackupService } from './use-backup';
import { useBackupStatus } from './use-backup-status';
import { useBackupToast } from './use-backup-toast';

/** How long a destructive button stays armed for its second tap. */
const ARM_MS = 3000;

/** The Backup sheet opened from Settings: the state of backup and what can be done about it. */
export function BackupManage() {
  const { t } = useI18n();
  const router = useRouter();
  const service = useBackupService();
  const { max } = useEntitlement();
  const { now } = useClock();
  const { status, refresh } = useBackupStatus();
  const toast = useToast();
  const sayDone = useBackupToast();
  const applyRestore = useApplyRestore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<BackupErrorKey | null>(null);
  const [empty, setEmpty] = useState(false);
  const [armed, setArmed] = useState<Armed>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const disarm = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(disarm.current), []);

  const arm = (what: Exclude<Armed, null>) => {
    haptics.tap();
    setArmed(what);
    clearTimeout(disarm.current);
    disarm.current = setTimeout(() => setArmed(null), ARM_MS);
  };

  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setEmpty(false);
    try {
      await task();
    } catch (failure) {
      setError(errorKeyOf(failure));
    } finally {
      setBusy(false);
    }
  }, []);

  // A key is here but this phone has not yet decided about the backup that may be on the server:
  // look at it now, so the person sees what they would be replacing.
  const unsettled = status?.kind === 'unsettled';
  useEffect(() => {
    if (!unsettled) return undefined;
    let live = true;
    setSearchFailed(false);
    service.findRestore().then(
      (search) => {
        if (!live) return;
        if (search.kind === 'none') void refresh();
        else setFound(search);
      },
      () => live && setSearchFailed(true),
    );
    return () => {
      live = false;
    };
  }, [unsettled, service, refresh]);

  const sendBackup = useCallback(async () => {
    try {
      if ((await service.backUpNow()) === 'empty') {
        setEmpty(true);
        return;
      }
      haptics.success();
      sayDone('backupDone');
    } catch (failure) {
      // A backup from another iPhone is there: the status now says so, and the sheet offers it.
      if (!isBackupError(failure) || failure.reason !== 'exists') throw failure;
    } finally {
      await refresh();
    }
  }, [service, sayDone, refresh]);

  const backUp = () => void run(sendBackup);

  const remove = () => {
    if (armed !== 'delete') return arm('delete');
    setArmed(null);
    haptics.tap();
    void run(async () => {
      const outcome = await service.deleteBackup();
      if (outcome === 'deleted') toast(t('backup.toast.deleted'));
      setFound(null);
      await refresh();
    });
  };

  const replace = () =>
    void run(async () => {
      await service.declineRestore();
      setFound(null);
      await sendBackup();
    });

  const restore = () => {
    if (found?.kind !== 'found') return;
    if (armed !== 'restore') return arm('restore');
    setArmed(null);
    void run(async () => {
      await service.restore(found.offer);
      await applyRestore(found.offer.snapshot.settings);
      haptics.success();
      sayDone('backupRestored');
      router.dismissTo('/');
    });
  };

  if (status === null) return null;
  return (
    <View style={{ gap: 12 }}>
      <BackupManageBody
        status={status}
        found={found}
        searchFailed={searchFailed}
        max={max}
        empty={empty}
        now={now.getTime()}
        busy={busy}
        armed={armed}
        onBackUp={backUp}
        onDelete={remove}
        onReplace={replace}
        onRestore={restore}
      />
      {error ? <BackupNote error>{t(error)}</BackupNote> : null}
    </View>
  );
}
