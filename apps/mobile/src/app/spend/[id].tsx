import { useLocalSearchParams, useRouter } from 'expo-router';

import { useMoney } from '../../data/money-provider';
import { findSpend } from '../../data/money-store';
import { SpendDetails } from '../../features/details/spend-details';
import { useI18n } from '../../i18n/i18n';
import { SheetScreen } from '../../ui/navigation/sheet-screen';

/** The spend sheet: one spend's details, closed when the spend is deleted. */
export default function SpendSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const found = findSpend(useMoney(), id) !== undefined;
  return (
    <SheetScreen title={t('details.title')}>
      {found ? <SpendDetails id={id} onDeleted={() => router.back()} /> : null}
    </SheetScreen>
  );
}
