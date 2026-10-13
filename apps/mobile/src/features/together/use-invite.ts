import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { Share } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { useToast } from '../../ui/toast/toast-host';
import { apiBase } from '../api/native-api';
import { useCompanionToast } from '../companion/use-companion-toast';
import { failureKey, useTogetherActions } from './together-provider';
import { inviteUrl } from './together-state';

/**
 * "Invite someone": a fresh single-use link from the server, copied, then offered to the system
 * share sheet so it can go by Messages, Zalo or anything else. The companion says it is copied.
 */
export function useInvite() {
  const { api, sync } = useTogetherActions();
  const { t } = useI18n();
  const toast = useToast();
  const say = useCompanionToast();
  const [busy, setBusy] = useState(false);

  const invite = useCallback(async () => {
    const base = apiBase();
    if (busy || base === null) return;
    setBusy(true);
    try {
      const { code } = await api.createInvite();
      const url = inviteUrl(base, code);
      await Clipboard.setStringAsync(url).catch(() => undefined);
      say('shareInvite');
      // The pair may have been made just now: show it.
      void sync.refresh();
      await Share.share({ message: t('together.invite.message', { url }) });
    } catch (error) {
      toast(t(failureKey(error)));
    } finally {
      setBusy(false);
    }
  }, [api, sync, busy, say, t, toast]);

  return { invite, busy };
}
