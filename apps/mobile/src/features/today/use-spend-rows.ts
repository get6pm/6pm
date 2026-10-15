import { useMemo } from 'react';

import type { SpendRow } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { toRowViews, type Labels } from './today-view';

/** The labels every spend list uses, in the current language. */
export function useSpendLabels(): Labels {
  const { t, language } = useI18n();
  const money = useMoneyFormat();
  return useMemo(() => {
    const time = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return {
      source: (source) => t(`source.${source}`),
      time: (iso) => time.format(new Date(iso)),
      tag: (row: SpendRow) =>
        row.status === 'pending'
          ? t('today.row.pending')
          : row.status === 'caught'
            ? t('today.row.toReview')
            : row.forWork
              ? t('today.row.claimBack')
              : row.status === 'skipped'
                ? t('today.row.notMine')
                : null,
      money,
    };
  }, [t, language, money]);
}

export function useSpendRows(
  spends: readonly SpendRow[],
  { category = true }: { readonly category?: boolean } = {},
) {
  const { categories } = useMoney();
  const labels = useSpendLabels();
  return useMemo(
    () => toRowViews(spends, categories, labels, category),
    [spends, categories, labels, category],
  );
}
