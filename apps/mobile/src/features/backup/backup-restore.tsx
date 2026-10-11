import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { errorKeyOf, unreadableKeyOf, type BackupErrorKey } from './backup-messages';
import { BackupButton, BackupCard, BackupNote } from './backup-parts';
import type { RestoreSearch } from './backup-service';
import { useApplyRestore } from './use-apply-restore';
import { useBackupService } from './use-backup';
import { useBackupToast } from './use-backup-toast';

type Phase = { readonly kind: 'looking' } | { readonly kind: 'offline' } | RestoreSearch;

/**
 * Restore on a fresh install, opened from the welcome step: finds the backup that the key in iCloud
 * Keychain opens, shows what is in it, and brings it back or starts fresh. Restoring replaces
 * everything on the phone, which at this point holds nothing.
 */
export function BackupRestore() {
  const { t, dayMonth } = useI18n();
  const router = useRouter();
  const service = useBackupService();
  const sayDone = useBackupToast();
  const applyRestore = useApplyRestore();
  const [phase, setPhase] = useState<Phase>({ kind: 'looking' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<BackupErrorKey | null>(null);

  const look = useCallback(() => {
    setPhase({ kind: 'looking' });
    service.findRestore().then(setPhase, () => setPhase({ kind: 'offline' }));
  }, [service]);
  useEffect(look, [look]);

  const attempt = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (failure) {
      setError(errorKeyOf(failure));
      setBusy(false);
    }
  };

  const restore = () => {
    if (phase.kind !== 'found') return;
    const { offer } = phase;
    void attempt(async () => {
      await service.restore(offer);
      await applyRestore(offer.snapshot.settings);
      haptics.success();
      sayDone('backupRestored');
      // The welcome step under this sheet gives way to Home.
      router.dismissAll();
      router.replace('/');
    });
  };

  const startFresh = () =>
    void attempt(async () => {
      await service.declineRestore();
      router.back();
    });

  const fresh = (
    <BackupButton disabled={busy} label={t('backup.restore.fresh')} onPress={startFresh} />
  );

  return (
    <View style={{ gap: 12 }}>
      {phase.kind === 'looking' ? <BackupNote>{t('backup.restore.looking')}</BackupNote> : null}
      {phase.kind === 'offline' ? (
        <>
          <BackupNote error>{t('backup.error.network')}</BackupNote>
          <BackupButton label={t('backup.retry')} onPress={look} />
        </>
      ) : null}
      {phase.kind === 'none' ? (
        <>
          <BackupNote>{t('backup.restore.none')}</BackupNote>
          {fresh}
        </>
      ) : null}
      {phase.kind === 'unreadable' ? (
        <>
          <BackupNote error>{t(unreadableKeyOf(phase.reason))}</BackupNote>
          {fresh}
        </>
      ) : null}
      {phase.kind === 'found' ? (
        <>
          <BackupCard
            icon="cloud_done"
            title={t('backup.restore.found', {
              date: dayMonth(new Date(phase.offer.updatedAt)),
            })}
            sub={t('backup.restore.sub', { count: phase.offer.items })}
          />
          <BackupButton
            primary
            disabled={busy}
            label={busy ? t('backup.restore.working') : t('backup.restore.do')}
            onPress={restore}
          />
          {fresh}
          <BackupNote>{t('backup.restore.freshNote')}</BackupNote>
        </>
      ) : null}
      {error ? <BackupNote error>{t(error)}</BackupNote> : null}
    </View>
  );
}
