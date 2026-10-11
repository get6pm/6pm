import { useEffect, useMemo, useState } from 'react';

import { useMoneyStore } from '../../data/money-provider';
import { readWallets } from '../../data/onboarding';
import { useI18n } from '../../i18n/i18n';
import { walletOptions, type WalletOption } from './wallet-options';

/** The wallets to pay with, from the ones chosen in onboarding, as soon as they have loaded. */
export function useWalletOptions(current?: string | null): WalletOption[] {
  const store = useMoneyStore();
  const { t } = useI18n();
  const [chosen, setChosen] = useState<readonly string[]>([]);
  useEffect(() => {
    let live = true;
    readWallets(store)
      .then((ids) => live && setChosen(ids))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [store]);
  const cashLabel = t('onboarding.wallets.cash');
  return useMemo(() => walletOptions(chosen, cashLabel, current), [chosen, cashLabel, current]);
}
