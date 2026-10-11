import { useI18n } from '../../i18n/i18n';
import { maxStatus } from './max-status';
import type { CustomerState } from './purchases-port';

/** The line a Max customer reads about their plan: "Renews 10 November.", "Trial ends …". */
export function useMaxStatusLine(customer: CustomerState): string | null {
  const { t, dayMonth } = useI18n();
  const status = maxStatus(customer.max);
  if (!status) return null;
  const date = dayMonth(new Date(status.at));
  return status.kind === 'trialEnds'
    ? t('max.terms.trialEnds', { date })
    : status.kind === 'renews'
      ? t('max.terms.renews', { date })
      : t('max.terms.ends', { date });
}
