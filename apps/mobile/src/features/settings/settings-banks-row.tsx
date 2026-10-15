import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useMoneyStore } from '../../data/money-provider';
import { readWallets } from '../../data/onboarding';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { SettingRow } from './setting-rows';

/** "Banks and wallets", with how many are chosen; opens the picker. */
export function SettingsBanksRow() {
  const router = useRouter();
  const store = useMoneyStore();
  const { t } = useI18n();
  const [count, setCount] = useState<number | null>(null);
  // Read again whenever Settings is back in front, so the count follows the picker.
  useFocusEffect(
    useCallback(() => {
      let live = true;
      readWallets(store)
        .then((ids) => live && setCount(ids.length))
        .catch(() => undefined);
      return () => {
        live = false;
      };
    }, [store]),
  );
  return (
    <SettingRow
      icon="account_balance"
      label={t('banks.title')}
      {...(count !== null ? { value: String(count) } : {})}
      onPress={() => {
        haptics.tick();
        router.push('/banks');
      }}
    />
  );
}
