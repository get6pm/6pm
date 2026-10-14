import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { formatShort } from '@6pm/domain';

import { useMoney, useMoneyStore } from '../../data/money-provider';
import { keptTogetherMoves, type KeptPot } from '../../data/together-moves';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { SheetScreen } from '../../ui/navigation/sheet-screen';
import { useToast } from '../../ui/toast/toast-host';
import { BackupButton, BackupCard, BackupNote } from '../backup/backup-parts';
import { SignInCancelled } from './apple-sign-in';
import { sharedPotRoute } from './shared-jar';
import { togetherRoutes } from './together-card';
import { ActionRow, AppleButton, RowCard, SharedPotRow } from './together-parts';
import { failureKey, useTogether, useTogetherActions } from './together-provider';
import { partnerOf } from './together-state';
import { useArmed } from './use-armed';
import { useInvite } from './use-invite';

/** What the person put into shared pots, as this phone keeps it; re-read as the copy changes. */
function useKept(): readonly KeptPot[] {
  const store = useMoneyStore();
  const { topUpsThisCycle } = useMoney();
  const { state } = useTogether();
  const [kept, setKept] = useState<readonly KeptPot[]>([]);
  useEffect(() => {
    let live = true;
    keptTogetherMoves(store.db).then(
      (rows) => live && setKept(rows),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [store, state, topUpsThisCycle]);
  return kept;
}

/**
 * Budget together's sheet. Signed out: what it is and Sign in with Apple. Signed in: the pair,
 * an invite while there is no partner, the shared pots, what this phone keeps, and leaving or
 * deleting the account (each tapped twice).
 */
export function TogetherSheet() {
  const { t, language } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { state, offline } = useTogether();
  const actions = useTogetherActions();
  const { invite, busy: inviting } = useInvite();
  const { armed, confirm } = useArmed<'leave' | 'delete'>();
  const kept = useKept();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { me, pair } = state;
  const partner = partnerOf(state);
  const pots = pair?.pots ?? [];

  const act = async (task: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      if (done !== undefined) {
        haptics.success();
        toast(done);
      }
    } catch (failure) {
      if (!(failure instanceof SignInCancelled)) {
        setError(me === null ? t('together.signIn.failed') : t(failureKey(failure)));
      }
    } finally {
      setBusy(false);
    }
  };

  if (me === null) {
    return (
      <SheetScreen title={t('together.title')} gap={12}>
        <BackupCard icon="group" title={t('together.intro.title')} sub={t('together.intro.sub')} />
        <AppleButton disabled={busy} onPress={() => void act(actions.signIn)} />
        {error === null ? null : <BackupNote error>{error}</BackupNote>}
        <BackupNote>{t('together.intro.note')}</BackupNote>
      </SheetScreen>
    );
  }

  const total = kept.reduce((sum, k) => sum + k.amount, 0);
  return (
    <SheetScreen title={t('together.title')} gap={12}>
      {offline ? <BackupNote>{t('together.offline')}</BackupNote> : null}
      <BackupCard
        icon="group"
        title={
          partner === null
            ? t('together.waiting.title')
            : t('together.paired.title', { name: partner.name ?? t('together.partner') })
        }
        sub={
          partner === null
            ? t('together.waiting.sub')
            : t('together.paired.sub', { count: pots.length })
        }
      />
      {partner === null ? (
        <>
          <BackupButton
            primary
            disabled={inviting}
            label={t('together.invite')}
            onPress={() => void invite()}
          />
          <BackupNote>{t('together.invite.note')}</BackupNote>
        </>
      ) : null}
      <RowCard>
        {pots.map((pot, i) => (
          <SharedPotRow
            key={pot.id}
            pot={pot}
            first={i === 0}
            onPress={() => router.push(sharedPotRoute(pot.id))}
          />
        ))}
        <ActionRow
          icon="add"
          label={t('together.newPot')}
          first={pots.length === 0}
          onPress={() => {
            haptics.tick();
            router.push(togetherRoutes.newPot);
          }}
        />
      </RowCard>
      {total > 0 ? (
        <BackupCard
          icon="savings"
          title={t('together.kept.title')}
          sub={t('together.kept.sub', { amount: formatShort(total, language) })}
        />
      ) : null}
      {error === null ? null : <BackupNote error>{error}</BackupNote>}
      {pair === null ? null : (
        <>
          <BackupButton
            danger
            disabled={busy}
            label={armed === 'leave' ? t('together.leaveConfirm') : t('together.leave')}
            onPress={() => {
              if (confirm('leave')) void act(actions.leave, t('together.left'));
            }}
          />
          <BackupNote>{t('together.leave.note')}</BackupNote>
        </>
      )}
      <BackupButton
        danger
        disabled={busy}
        label={armed === 'delete' ? t('together.deleteConfirm') : t('together.deleteAccount')}
        onPress={() => {
          if (confirm('delete')) void act(actions.deleteAccount, t('together.deleted'));
        }}
      />
      <BackupNote>{t('together.delete.note')}</BackupNote>
    </SheetScreen>
  );
}
