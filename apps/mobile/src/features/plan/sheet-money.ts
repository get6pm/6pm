import { useMemo } from 'react';

import { currencyOf, type MoneyFormat } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { moneyFormatFor, useMoneyFormat } from '../../money/use-money-format';

/**
 * How a pot sheet writes money: in the pot's own currency when it has one (a shared pot made by
 * someone at home in another currency), else in the home currency.
 */
export function useSheetMoney(code?: string): MoneyFormat {
  const home = useMoneyFormat();
  const { language } = useI18n();
  return useMemo(
    () => (code === undefined ? home : moneyFormatFor(currencyOf(code), language)),
    [code, home, language],
  );
}
