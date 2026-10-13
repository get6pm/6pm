import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { inviteRefusalSchema, type InviteRefusal, type TogetherState } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { SheetScreen } from '../../ui/navigation/sheet-screen';
import { useToast } from '../../ui/toast/toast-host';
import { ApiRequestError } from '../api/api-error';
import { BackupButton, BackupCard, BackupNote } from '../backup/backup-parts';
import { SignInCancelled } from './apple-sign-in';
import { togetherRoutes } from './together-card';
import { failureKey, useTogether, useTogetherActions } from './together-provider';
import { partnerOf } from './together-state';
import { AppleButton } from './together-parts';

type JoinErrorKey =
  | `together.join.${InviteRefusal}`
  | 'together.join.missing'
  | 'together.signIn.failed'
  | ReturnType<typeof failureKey>;

/** Why an invite could not be taken, in words the person can act on. */
export function joinErrorKey(error: unknown): JoinErrorKey {
  if (error instanceof ApiRequestError) {
    const reason = inviteRefusalSchema.safeParse(error.reason);
    if (reason.success) return `together.join.${reason.data}`;
    if (error.failure === 'bad_request') return 'together.join.missing';
  }
  return failureKey(error);
}

/**
 * The sheet an invite link opens (`/app/together/<code>`): sign in with Apple if this phone has
 * not, then join. Joining needs no Max of one's own: the invite is the way in.
 */
export function TogetherJoin() {
  const { code = '' } = useLocalSearchParams<{ code?: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { state } = useTogether();
  const { signIn, api, sync } = useTogetherActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<JoinErrorKey | null>(null);

  const join = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    let signedIn = state.me !== null;
    try {
      if (!signedIn) {
        await signIn();
        signedIn = true;
      }
      const next: TogetherState = await api.acceptInvite(code);
      sync.adopt(next);
      haptics.success();
      const partner = partnerOf(next);
      toast(t('together.joined', { name: partner?.name ?? t('together.partner') }));
      router.replace(togetherRoutes.manage);
    } catch (failure) {
      if (failure instanceof SignInCancelled) return;
      setError(signedIn ? joinErrorKey(failure) : 'together.signIn.failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetScreen title={t('together.join.title')} gap={12}>
      <BackupCard icon="group" title={t('together.intro.title')} sub={t('together.join.sub')} />
      {state.me === null ? (
        <AppleButton join disabled={busy} onPress={() => void join()} />
      ) : (
        <BackupButton
          primary
          disabled={busy}
          label={t('together.join.button')}
          onPress={() => void join()}
        />
      )}
      {error === null ? null : <BackupNote error>{t(error)}</BackupNote>}
      <BackupNote>{t('together.intro.note')}</BackupNote>
    </SheetScreen>
  );
}
