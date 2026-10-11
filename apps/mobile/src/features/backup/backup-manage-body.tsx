import type { ReactNode } from 'react';

import { useI18n } from '../../i18n/i18n';
import { unreadableKeyOf } from './backup-messages';
import { BackupButton, BackupCard, BackupNote } from './backup-parts';
import type { BackupStatus, RestoreSearch } from './backup-service';
import { useWhenText } from './use-when-text';

export type Armed = 'delete' | 'restore' | null;
export type Found = Extract<RestoreSearch, { kind: 'found' | 'unreadable' }>;

export interface BackupManageBodyProps {
  readonly status: BackupStatus;
  /** The backup waiting on the server, once it has been looked at. */
  readonly found: Found | null;
  readonly searchFailed: boolean;
  /** Whether the person has Max. Without it, backups pause but the last one can still be managed. */
  readonly max: boolean;
  /** The last "Back up now" found nothing to send. */
  readonly empty: boolean;
  readonly now: number;
  readonly busy: boolean;
  readonly armed: Armed;
  readonly onBackUp: () => void;
  readonly onDelete: () => void;
  readonly onReplace: () => void;
  readonly onRestore: () => void;
}

/** What the sheet shows for each state of backup. */
export function BackupManageBody(props: BackupManageBodyProps): ReactNode {
  const { status, found, max, busy, armed } = props;
  const { t } = useI18n();
  const whenText = useWhenText();

  if (status.kind === 'deleting') {
    return (
      <BackupCard
        icon="cloud_off"
        title={t('backup.row.deleting')}
        sub={t('backup.deletePending')}
      />
    );
  }

  if (status.kind === 'unsettled') {
    const unreadable = found?.kind === 'unreadable' ? found : null;
    return (
      <>
        <BackupCard icon="cloud_done" title={t('backup.found.title')} sub={t('backup.found.sub')} />
        {unreadable ? <BackupNote error>{t(unreadableKeyOf(unreadable.reason))}</BackupNote> : null}
        {props.searchFailed ? <BackupNote error>{t('backup.error.network')}</BackupNote> : null}
        {found?.kind === 'found' ? (
          <BackupButton
            primary
            disabled={busy}
            label={
              armed === 'restore' ? t('backup.found.restoreConfirm') : t('backup.found.restore')
            }
            onPress={props.onRestore}
          />
        ) : null}
        {max && unreadable?.reason !== 'unsupported' ? (
          <BackupButton
            disabled={busy || found === null}
            label={t('backup.found.replace')}
            onPress={props.onReplace}
          />
        ) : null}
      </>
    );
  }

  if (status.kind === 'off') {
    return (
      <>
        <BackupCard icon="cloud_done" title={t('backup.off.title')} sub={t('backup.off.sub')} />
        {props.empty ? <BackupNote>{t('backup.empty')}</BackupNote> : null}
        <BackupButton
          primary
          disabled={busy || !max}
          label={busy ? t('backup.working') : t('backup.turnOn')}
          onPress={props.onBackUp}
        />
        <BackupNote>{t('backup.note')}</BackupNote>
      </>
    );
  }

  return (
    <>
      <BackupCard
        icon="cloud_done"
        title={
          status.lastAt === null
            ? t('backup.status.never')
            : t('backup.status.on', { when: whenText(status.lastAt, props.now) })
        }
        sub={
          status.items === null
            ? t('backup.status.neverSub')
            : t('backup.status.sub', { count: status.items })
        }
      />
      {status.tooLarge ? <BackupNote error>{t('backup.tooLarge')}</BackupNote> : null}
      {!max ? <BackupNote>{t('backup.paused')}</BackupNote> : null}
      {props.empty ? <BackupNote>{t('backup.empty')}</BackupNote> : null}
      {max ? (
        <BackupButton
          primary
          disabled={busy}
          label={busy ? t('backup.working') : t('backup.now')}
          onPress={props.onBackUp}
        />
      ) : null}
      <BackupButton
        danger
        disabled={busy}
        label={armed === 'delete' ? t('backup.deleteConfirm') : t('backup.delete')}
        onPress={props.onDelete}
      />
      <BackupNote>{t('backup.note')}</BackupNote>
    </>
  );
}
